local length = ARGV[1]

for i=1, length do
  local offset = (i-1)*6 + 1
  local set     = ARGV[offset+1]
  local prop    = ARGV[offset+2]
  local storage = ARGV[offset+3]
  local score   = ARGV[offset+4]
  local value   = ARGV[offset+5]
  local member  = ARGV[offset+6]

  if value == 'NaN' or value == 'undefined' then
    redis.call('HDEL', member, prop)
  else
    redis.call('HSET', member, prop, value)
  end

  if storage == '1' then
    redis.call('ZADD', set, score, member)
  elseif storage == '2' then
    local discreteSets = redis.call('SMEMBERS', set .. ':sets')
    local setCount = table.getn(discreteSets)
    for j=1, setCount do
      local discreteSet = discreteSets[j]
      redis.call('SREM', discreteSet, member)
    end

    local discreteSet = set .. '-' .. score
    redis.call('SADD', discreteSet, member)
  end
end
