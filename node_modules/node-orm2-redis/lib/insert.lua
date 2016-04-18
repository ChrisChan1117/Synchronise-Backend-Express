local length = ARGV[1]

for i=0, length do
  local offset = i*4 + 1
  local set     = ARGV[offset+1]
  local storage = ARGV[offset+2]
  local score   = ARGV[offset+3]
  local member  = ARGV[offset+4]

  if storage == '1' then
    redis.call('ZADD', set, score, member)
  elseif storage == '2' then
    local discreteSet = set .. '-' .. score
    redis.call('SADD', discreteSet, member)
  end
end
