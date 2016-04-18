local length = ARGV[1]

local results = {}
for i=1, length do
  local key    = ARGV[i+1]

  local obj = redis.call('HGETALL', key)
  table.insert(results, obj)
end
return results
