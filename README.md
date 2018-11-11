# FaaStest

**! This module depends on the `--experimental-workers` Node.js flag, and is NOT fit for production use !**

**! The module scheduling is crude and unfair, it is NOT fit for production use !**

**! This is just an experiment !**

This module in an experiment to explore a Node.js Function-as-a-service runtime whereby:
 * The cost of idle functions is close to 0.
 * Each function can bring its own set of dependencies.
 * The cost of any function loading it's dependencies on each invocation is minimised.
 * The risk of one bad function getting stuck in an infinite loop and impacting other functions is managed.
 * The *security aspects* of running potentially untrusted code are *not yet fully understood*.

This module expects you to bring your own function triggers. This gives you total freedom over how functions get invoked, for example:
 * Whenever a HTTP request arrives.
 * Whenever a PubSub event arrives.
 * Whenever a Slack message is seen by a bot.
 * Whenever someone pushes to Github.
 * Whenever [insert-something-awesome-here].

## Module (Function) specification

 1. You must export an object.
 2. The exported object must have properties with names matching the desired function names.
 3. All functions must be `async`.

```javascript
const calculator = module.exports = { }

calculator.add = async function () { }
calculator.subtract = async function () { }
```

Functions are namespaced by:
 * Module name and version.
 * Function name within module.

During your CI deploy process, you'll need to use something like `rollup` to bundle your function, and it's dependencies into a singular JS file. This repo contains a rollup config used to generate the examples:
```
$ rollup ./example/code/calculator-v1.0.0-raw.js -c --format=cjs > ./example/code/calculator-v1.0.0.js
```

Once the JS is bundled into a singular file, store it someplace safe.

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

 * There is a [worker_threads](https://nodejs.org/docs/latest-v10.x/api/worker_threads.html) pool of between `0` and `maxWorkers` threads.
 * `maxWorkers` is set to a vague guess based on the memory available to the process.
 * As triggers are invoked, modules get `new vm.Script()` loaded into the threads.
 * There is one module per thread.
 * Modules will only exist in one thread at a time.
 * Each thread + module will serve many requests until it is terminated in order to schedule some other module.
 * If we are below `maxWorkers` threads, new threads are created for each new module being requested.
 * If the worker pool is full, idle workers are terminated and the next queued modules are loaded in.

## Performance

Give it a go yourself via the example implementation:
```
$ npm start
```

If all the functions you're triggering are "hot", or loaded, the performance looks like this:
```
Min 0.037 ms
P50 0.301 ms
Avg 0.632 ms
P95 0.984 ms
```

If all the functions you're triggering are "cold", or need loading, the performance looks like this:
```
Min 55.48 ms
P50 58.357 ms
Avg 59.77 ms
P95 69.11 ms
```

## Future Exploration

We may see much better performance by loading many modules into each worker, which would make managing the worker pool way more challenging.
