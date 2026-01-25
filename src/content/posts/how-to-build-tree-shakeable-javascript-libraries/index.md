---
title: How to build tree-shakeable JavaScript libraries
description: Learn to write tree-shakeable code and design tree-shakeable libraries.
date: 2022-09-14
cover: ./cover.png
tags:
  - tree-shaking
  - bundling
  - optimization
---

If you’re a web developer, I’m sure that you’ve heard about *tree-shaking*. It’s often understood as the removal of unused code from JavaScript bundles. However, do you know that not all code that looks unused is tree-shakeable?

In this blog post, we’ll learn more about tree-shaking and tree-shakable design. You’ll know to write JavaScript code in a tree-shakeable way and produce smaller bundles. If you’re building a JavaScript library, is a must.

## What is tree-shaking?

Wait! If tree-shaking is the removal of unused code from bundles, then how is it different from “dead code elimination” that has been a feature of JavaScript minifiers for quite a while? It’s a fair question, and the answer is that tree-shaking is a later term that is only relevant if JavaScript bundlers and ES6 imports/exports are used.

Bundlers analyze ES6 imports/exports at build time to find unused code. Since ES6 imports/exports are a part of JavaScript syntax, it’s quite easy to perform a static analysis of used and unused exports.

On the other hand, CommonJS exports are resolved at run time and can be dynamic. That’s why static analysis of used and unused exports is impossible for CommonJS modules.

**Let’s compare how Webpack bundles CommonJS and ES6 modules.** In this example, we export two functions (`sum` and `div`) from a CommonJS module but only one of them (`sum`) is imported and used. (Note that here the code in `bundle.js` is shown *before minification*.)

```javascript
// CommonJS
// module.js

exports.sum = function sum(a, b) {
  return a + b;
};

exports.div = function div(a, b) {
  return a / b;
};

// index.js

const { sum } = require('./module');

console.log(sum);

// bundle.js

(() => {
  var __webpack_modules__ = ({
    739:
      ((__unused_webpack_module, exports) => {
        exports.sum = function sum(a, b) {
          return a + b;
        };

        exports.div = function div(a, b) {
          return a / b;
        };
      })
  });

  function __webpack_require__(moduleId) {
    /* ... */
  }

  (() => {
    const { sum } = __webpack_require__(739);

    console.log(sum);
  })();
})();
```

You can see that Webpack added the `__webpack_require__` function to the bundle to support CommonJS module loading. Also, the `div` function is present in the bundle and won’t be removed after minification because it’s assigned to an object property (`exports.div`) and will be considered “used”. Compare to an ES6 module:

```javascript
// ESM
// module.js

export function sum(a, b) {
  return a + b;
}

export function div(a, b) {
  return a / b;
}

// index.js

import { sum } from './module.js';

console.log(sum);

// bundle.js

(() => {
  "use strict";

  function sum(a, b) {
    return a + b;
  }

  function div(a, b) {
    return a / b;
  }

  console.log(sum)
})();
```

You can see that the `div` function was copied “as is” and is not used in any way. When you run Webpack in production mode, it will remove this function. (Internally, Webpack relies on [Terser](https://terser.org/) for minification; [Rollup](https://rollupjs.org/) performs tree-shaking and dead code elimination on its own.)

## What is tree-shakable code?

In the example above, two functions were exported from the module and only the “used” one made it to the bundle. What if not only functions are exported? (Note that here the code in `bundle.js` is shown *after minification*.)

```jsx
// module.js

export const foo = 'bar'.toUpperCase();

export const PI_2 = Math.PI * 2;

export function sum(a, b) {
  return a + b;
}

// index.js

import { sum } from './module.js'

console.log(sum);

// bundle.js

(() => {
  "use strict";
  "bar".toUpperCase(), Math.PI;
  console.log((function(a, b) {
    return a + b;
  }));
})();
```

You might be surprised that all exported entities are present in the bundle, although only the `sum` function was imported. Let’s explore why.

### Pure code

Removing unused functions is quite straightforward. If a function is never called, its declaration should be considered “dead code” and removed from the bundle. It works because function declarations have no *side effects*: they don’t update global variables, don’t work with DOM, etc. (Please don’t confuse function declarations with function calls; the latter may have side effects.)

Consider the first exported entity: `'bar'.toUpperCase()`. This is a function call and it may have side effects. Well, we know that `toUpperCase` is a *pure function*, meaning calling it has no side effects. However, minifiers know nothing about the standard library. That’s why the function call wasn't removed from the bundle so the code doesn’t break.

Now consider the second exported entity: `Math.PI * 2`. This is an arithmetic operation (a constant is multiplied by two) and should not have any side effects. Now take a closer look: what does `Math.PI` do? It denotes access to a property of an object and it may have side effects. Access to a variable is always pure, but access to a property may invoke a getter method that can do anything. Minifiers don’t know how pure that code is so they leave it intact. (Obviously, this logic applied to setters as well.)

### How to make pure code tree-shakable?

If you know that some code is pure, there’s a way to tell minifiers about that. By convention, placing the `/* #__PURE__ */` comment before a function call or a constructor call (`new`) marks them as pure. If you need to mark access to a property as pure, you can wrap it with a pure function:

```jsx
// module.js

export const foo = /* #__PURE__ */ 'bar'.toUpperCase();

function getPi2() {
  return Math.PI * 2;
}

export const PI_2 = /* #__PURE__ */ getPi2();

export function sum(a, b) {
  return a + b;
}

// index.js

import { sum } from './module.js'

console.log(sum);

// bundle.js

(() => {
  "use strict";
  console.log((function(a, b) {
    return a + b;
  }));
})();
```

Now it looks better, right?

Here are a few real-world examples of code purification from my contributions to open source:

- In [Chart.js](https://www.chartjs.org), tree-shaking [didn’t work as expected](https://github.com/chartjs/Chart.js/issues/10163) because of assignments to class properties ([replaced with static properties](https://github.com/chartjs/Chart.js/pull/10504/files#diff-20242c6d6e67c730511b603d00054d6c95d7698f180cc1eaeeff4dd3278b9c98)).
- In [react-chartjs-2](https://react-chartjs-2.js.org), some exported entities are constructed by calling a factory method ([marked as pure](https://github.com/reactchartjs/react-chartjs-2/blob/59b64feb7d9a24b3557e253f9089225031ce2b72/src/typedCharts.tsx#L33-L59)).

You can experiment with dead code detection yourself in [Terser REPL](https://try.terser.org/).

### `sideEffects: false`

If you’re building a library, you should know about the `sideEffects` property in the `package.json` file. It's similar to `/* #__PURE__ */` but on a module level instead of a statement level. By setting it to `false`, you can mark the entire code of your library as pure:

```json
{
  "sideEffects": false
}
```

You can also set it to an array of files that contain side effects:

```json
{
  "sideEffects": ["./dist/polyfill.js"]
}
```

You can learn more about the `sideEffects` property in the [Webpack documentation](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free). Please pay attention to this behavior: a package, marked as pure with `sideEffects: false`, will be skipped entirely if imported as a whole.

```javascript
// module.js

export const foo = 'bar'.toUpperCase();

export const PI_2 = Math.PI * 2;

export function sum(a, b) {
  return a + b;
}

// index.js

import './module.js'

console.log('noop');

// bundle.js

(() => {
  "use strict";
  console.log('noop');
})();
```

However, if individual entities are imported, everything works as described in the previous section and you still need to use `/* #__PURE__ */`:

```javascript
// module.js

export const foo = 'bar'.toUpperCase();

export const PI_2 = Math.PI * 2;

export function sum(a, b) {
  return a + b;
}

// index.js

import { sum } from './module.js'

console.log(sum);

// bundle.js

(() => {
  "use strict";
  "bar".toUpperCase(), Math.PI;
  console.log((function(a, b) {
    return a + b;
  }));
})();
```

Things to consider when using `sideEffects: false`:

- If your library code is already covered with `/* #__PURE__ */`, using `sideEffects: false` will have no effect.
- If your library provides global style sheets (not [CSS modules](https://webpack.js.org/loaders/css-loader/#modules)), they should also be added to the array of files that contain side effects:

```json
{
  "sideEffects": ["./dist/index.css"]
}
```

It’s required because such style sheets are usually imported directly:

```javascript
import 'mylib/dist/index.css'
```

- Beware when developing a library: bundlers will look for `sideEffects: false` not only in the dependencies of your library but in its `package.json` as well.

## Tree-shakable design

Now we know how tree-shaking works in principle. However, we should also design a library in a tree-shakeable way. For instance, if the entire library is packed in a single class, tree-shaking wouldn’t be able to remove any code.

Here are the rules of tree-shakable design:

1. All entities, including class methods, that might not be used should be exported separately (so they can potentially be removed from the bundle).
2. Classes and objects should be exported cautiously (because their contents can’t be removed from the bundle).
3. All code should be free of side effects by default. Minimal, if any, instances of non-pure code should be permitted.

Consider the following examples.

### Example A

Imagine we’re writing an internationalization library:

```javascript
// non-tree-shakable

import I18n from 'my-i18n-lib';

const i18n = new I18n(config);

console.log(i18n.__('foo'));
// console.log(i18n.__n('bar', 5));

// tree-shakable

import { I18n, translate, translatePlural } from 'my-i18n-lib';

const i18n = new I18n(config);
const __ = i18n.bind(translate);

console.log(__('foo'));
```

🙅 In the non-tree-shakable variant, a single giant class is exported. The bundle will include all class methods, including unused ones.

🙆 In the tree-shakable variant, potentially unused class methods are exported separately as functions. The bundle will include only used functions.

### Example B

Imagine we’re writing a data visualization library:

```javascript
// non-tree-shakable

import { BarChart } from 'my-charting-lib';

new BarChart('#chart', data, {
  axisX: {
    type: 'auto'
  },
  axisY: {
    type: 'fixed' // 'step'
  }
});

// tree-shakable

import {
  BarChart,
  AutoScaleAxis,
  FixedScaleAxis,
  StepAxis
} from 'my-charting-lib';

new BarChart('#chart', data, {
  axisX: {
    type: AutoScaleAxis
  },
  axisY: {
    type: FixedScaleAxis
  }
});
```

🙅 In the non-tree-shakable variant, all axis types should be imported inside `BarChart` so it can use some of them according to the options provided. The bundle will include all classes for all axis types.

🙆 In the tree-shakable variant, only necessary axis types are imported and provided to `BarChart`. The bundle will include classes only for used axis types.

(Full disclosure: this is a real-world design decision from [Chartist](https://github.com/chartist-js/chartist), an open-source data visualization library I maintain and contribute to.)

### Example C

Imagine we’re writing a more complex data visualization library like [Chart.js](https://github.com/chartjs/Chart.js). In that case, you may choose to implement [dependency injection](https://medium.com/geekculture/dependency-injection-in-javascript-2d2e4ad9df49):

```javascript
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend
);

new Chart(ctx, {
  type: 'line',
  data: data,
  options: {
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
      },
    }
  }
});
```

🙆 In this tree-shakable implementation, dependency injection via `Chart.register` is used. Library code is very well split into individual parts that are exported separately. The bundle will include classes only for used entities.

## Keeping code tree-shakable

A one-time effort to write or rewrite a JavaScript library in a tree-shakable way is not enough. One day, due to lousy code or code review, tree-shaking might brake.

However, you can use the [Size Limit](https://github.com/ai/size-limit) library to control the size of a bundle or individual exports. Here’s an example configuration:

```javascript
// .size-limit.json

[
  {
    "path": "dist/chart.esm.js",
    "limit": "19 KB",
    "import": "{ BarController, BubbleController, DoughnutController, LineController, PolarAreaController, PieController, RadarController, ScatterController }"
  },
  {
    "path": "dist/chart.esm.js",
    "limit": "14 KB",
    "import": "{ ArcElement, LineElement, PointElement, BarElement }"
  },
  {
    "path": "dist/chart.esm.js",
    "limit": "27 KB",
    "import": "{ Decimation, Filler, Legend, SubTitle, Title, Tooltip }"
  },
  {
    "path": "dist/chart.esm.js",
    "limit": "22 KB",
    "import": "{ CategoryScale, LinearScale, LogarithmicScale, RadialLinearScale, TimeScale, TimeSeriesScale }"
  }
]
```

Size Limit integrates with CI such as GitHub Actions and will alert you if any pull request drastically increases the bundle size, possibly due to broken tree-shaking.

## What’s next?

Please use tree-shaking in your code at all times. If you’d like to learn how tree-shaking works by example, check out [this sandbox](https://codesandbox.io/s/webpack-tree-shaking-test-glb8ov?file=/src/module.js) I’ve built.

If you have an existing application or library:

- make sure it complies with the three rules of tree-shakable design;
- make sure pure functions are marked as such with `/* #__PURE__ */`;
- make sure [Size Limit](https://github.com/ai/size-limit) is used to notify if tree-shaking brakes.

Good luck!
