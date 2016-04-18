grunt = require 'grunt'

grunt.loadNpmTasks 'grunt-exec'

module.exports = ->
  @initConfig
    exec:
      tests:
        command: 'mocha --reporter spec --compilers coffee:coffee-script/register'

  @registerTask "tests", ["exec:tests"]
