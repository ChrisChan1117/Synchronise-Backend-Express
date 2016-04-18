local length = ARGV[1]

for i=0, length do
  local offset = i*3 + 1
  local set    = ARGV[offset+1]
  local score  = ARGV[offset+2]
  local member = ARGV[offset+3]

  redis.call('ZADD', set, score, member)
end
