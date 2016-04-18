local queryId         = ARGV[1]
local limit           = ARGV[2]
local offset          = ARGV[3]
local conditionsCount = ARGV[4]

local hardlimit = 10000 --no single subquery can return more than this

local function split(inputstr)
  local t={}
  local i=1
  for str in string.gmatch(inputstr, "([^,]+)") do
          t[i] = str
          i = i + 1
  end
  return t
end

local function massive_redis_command(command, key, t)
  --https://github.com/antirez/redis/issues/678
  local i = 1
  local temp = {}
  while(i <= #t) do
    table.insert(temp, t[i+1])
    table.insert(temp, t[i])
    if #temp >= 1000 then
        redis.call(command, key, unpack(temp))
        temp = {}
    end
    i = i+2
  end
  if #temp > 0 then
    redis.call(command, key, unpack(temp))
  end
end

local function slice(array, start_index, length)
  --https://github.com/mirven/underscore.lua
  local sliced_array = {}

  start_index = math.max(start_index, 1)
  local end_index = math.min(start_index+length-1, #array)
  for i=start_index, end_index do
    sliced_array[#sliced_array+1] = array[i]
  end
  return sliced_array
end

local function union(arrayA, arrayB)
  local result = arrayA
  local resultCount = table.getn(result)
  local arrayBCount = table.getn(arrayB)
  for i=0, arrayBCount do
    local alreadyPresent = false
    local value = arrayB[i+1]

    for j=0, resultCount do
      if result[j+1] == value then
        alreadyPresent = true
        break
      end
    end

    if alreadyPresent == false then
      table.insert(result, value)
      resultCount = resultCount + 1
    end
  end
  return result
end

local subSets = {}
local toDelete = {}
local error = false

for i=1,conditionsCount do
  local offset = (i-1)*4
  local set      = ARGV[5 + offset]
  local op       = ARGV[6 + offset]
  local minScore = ARGV[7 + offset]
  local maxScore = ARGV[8 + offset]
  local keys = {}
  if op == "between" then
    keys = redis.call('ZRANGEBYSCORE', set, minScore, maxScore, 'LIMIT', 0, hardlimit)
  elseif op == "in" then
    local alts = split(minScore)
    local altsCount = table.getn(alts)
    for j=0, altsCount do
      local alt = alts[j+1]
      local altKeys = redis.call('ZRANGEBYSCORE', set, alt, alt, 'LIMIT', 0, hardlimit)
      keys = union(keys, altKeys)
    end
  elseif op == "set" then
    local subSet = set .. '-' .. minScore
    table.insert(subSets, subSet)
  end

  if table.getn(keys) == hardlimit then
    subSets = {}
    error = true
    break
  elseif table.getn(keys) > 0 and op ~= "set" then
    local subQueryId = queryId .. '-' .. i
    massive_redis_command('SADD', subQueryId, keys)
    table.insert(subSets, subQueryId)
    table.insert(toDelete, subQueryId)
  elseif op ~= "set" then
    -- one of our sub-filters returned 0 results
    -- we should stop immediately, and return nothing
    subSets = {}
    break
  end
end

if error then
  return "ERROR"
else
  local result = {}
  if table.getn(subSets) > 0 then
    result = redis.call('SINTER', unpack(subSets))
    result = slice(result, offset+1, limit)
  end
  if table.getn(toDelete) > 0 then
    redis.call('DEL', unpack(toDelete))
  end
  return result
end
