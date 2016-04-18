local model = ARGV[1]
local key   = ARGV[2]

local properties = redis.call('HKEYS', key)

for i=1, table.getn(properties) do
  local prop = properties[i]
  local indexKey = model .. ':' .. prop
  local type = redis.call('TYPE', indexKey)
  if type == 'zset' then
    redis.call('ZREM', indexKey, key)
  else
    local discreteSets = redis.call('SMEMBERS', indexKey .. ':sets')
    local setCount = table.getn(discreteSets)
    for j=1, setCount do
      local discreteSet = discreteSets[j]
      redis.call('SREM', discreteSet, key)
    end
  end
end

redis.call('ZREM', model .. ':id', key)
redis.call('DEL', key)
