import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_TOKEN'] = process.env.TEST_TOKEN ?? ''
  process.env['INPUT_PRODUCTION_BRANCH'] =
    process.env.TEST_PRODUCTION_BRANCH ?? ''
  process.env['INPUT_STAGING_BRANCH'] = process.env.TEST_STAGING_BRANCH ?? ''
  process.env['INPUT_DRY_RUN'] = 'true'
  process.env['INPUT_DRAFT'] = 'true'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
