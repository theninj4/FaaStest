# FaaStest

**! This module depends on the `--experimental-workers` Node.js flag, and is NOT fit for production use !**

**! The module scheduling is crude and unfair, it is NOT fit for production use !**

**! This is just an experiment !**

This module in an experiment to explore a Node.js Function-as-a-service runtime whereby:
 * The cost of idle functions is close to 0.
 * Each function can bring its own set of dependencies.
 * The cost of any function loading it's dependencies on each invocation is minimised.
 * The risk of one bad function getting stuck in an infinite loop and impacting other functions is *managed*.
 * The *security aspects* of running potentially untrusted code are *not yet fully understood*.

This module expects you to bring your own function triggers. This gives you total freedom over how functions get invoked, for example:
 * Whenever a HTTP request arrives.
 * Whenever a PubSub event arrives.
 * Whenever a Slack message is seen by a bot.
 * Whenever someone pushes to Github.
 * Whenever [insert-something-awesome-here].

## Module (Function) specification

 1. You *should* write ES Modules.
 2. The exported functions *must* be `async`.
 3. You may export many functions.

```javascript
import { promisify } from 'util'
const pause = promisify(setTimeout)

export async function add (payload) {
  await pause(10)
  return payload.a + payload.b
}
```

Functions are namespaced by:
 * Module name and version.
 * Function name within module.

During your CI deploy process, you'll need to use something like `rollup` to bundle your function and it's dependencies into a singular JS file. This repo contains a rollup config used to generate the examples and we ship with a ease-of-access wrapper:
```
$ npm i -g github:theninj4/faastest
$ faastest-bundle -i ./example/code/calculator-v1.0.0-raw.js -o ./example/code/calculatorA-v1.0.0.js
--or--
$ faastest-bundle ./example/code/*.js ./example/code/compiled/
```

Once the JS is bundled into a singular file, store it someplace safe. You'll need to provide access to it later.

On the subject of dependencies, you'll want to seek out lightweight alternatives to some of the heavy popular modules on NPM. You can use these kinds of tools to manage your package sizes:
 * [BundlePhobia](https://bundlephobia.com/) - Web UI, also suggests similar smaller alternatives!
 * [Cost of modules](https://github.com/siddharthkp/cost-of-modules) - For the terminal

## Module Loader

In your runtime, you'll need to tell FaaStest how it can find your bundled JS:

```javascript
const faastest = require('../.')
const fs = require('fs')

faastest.defineFunctionLoader(async function (module, version) {
  return fs.promises.readFile(`${__dirname}/code/${module}-${version}.js`, { encoding: 'utf8' })
})
```

## Triggering a Function

Name your module and version, name your func, specify the payload, await the result:
```javascript
const faastest = require('../.')
...
const result = await faastest.trigger({
  module: 'calculator',
  version: 'v1.0.0',
  func: 'add',
  payload: { a: 0, b: 1 }
})
```

## Under the Hood

 * There is a [worker_threads](https://nodejs.org/docs/latest-v10.x/api/worker_threads.html) pool consisting of 10 threads.
 * Modules get dynamically loaded via `vm.Script()` onto the threads as they're needed.
 * There is one module per thread.
 * Modules will only exist in one thread at a time.
 * Each thread + module will serve many requests until it is descheduled in order to schedule some other queued module.

## Performance

Give it a go yourself via the example implementation:
```
$ npm start
```

If all the functions you're triggering are "hot", or loaded, the performance overhead looks vaguely like this:
```
Min 0.068 ms
P50 0.092 ms
Avg 0.129 ms
P95 0.186 ms
```

If all the functions you're triggering are "cold", or need loading, the performance overhead looks vaguely like this:
```
Min 0.817 ms
P50 1.039 ms
Avg 1.227 ms
P95 1.902 ms
```

## Future Exploration

Error handling
Proper benchmarking
