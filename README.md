# TypeScript Build v2.0.0+

**Copy files to output directory after `tsc` build**

TypeScript Build (tsb) works in one of two modes. **TSC** mode will run `tsc` with the arguments passed to `tsb` and copy files based on a config if present while **Copy only** mode will only copy files based on the `tsbconfig.json` content.

## Install

```
npm install --dev typescript typescript-build
```

or

```
yarn add --dev typescript typescript-build
```

## Usage

1. At the root of the project (next to your `tsconfig.json` if in TSC mode) create a `tsbconfig.json` as described below.
1. Run the `tsb` command as you would `tsc`.

### Example

```json
{
  "copyFiles": [
    {
      "files": ["src/**/*.css"],
      "outDirectories": ["dist"],
      "up": 1
    }
  ]
}
```

- `files`: array of [globs](https://github.com/isaacs/node-glob) to match and copy to `outDirectories`
- `outDirectories`: the output directories relative to the directory of the `tsbconfig.json` file
- `up`: (optional) number of directories to remove from the matches
- `skipClean`: (optional/default to false) will skip removing the `outDirectories` on clean

Let's say you have a `tsconfig.json` file with `"outDirectories": ["dist"]` and the above `tsbconfig.json` in the same directory, and you run `tsb --build` the following will happen:

1. TSB will execute `tsc --build`
1. If `tsc` succeeds, it will copy all of the css files from the src directory into the dist directory matching the directory, but removing one level form the matches. (e.g. `src/papaya/coolcss.css` will be copied to `dist/papaya/coolcss.css`)

In the case of `tsb --build --clean` it will:

1. Execute `tsc --build --clean`
1. If `tsc` succeeds, it will delete the `outDirectories` and all of its content unless `skipClean` is set to `true`.

## FAQ

- Why is nothing happening?
  - `tsb` will only perform the copy of files if the `--build` options is used and the clean-up if both `--build` and `--clean` options are used.
- Will it follow references?
  - Yes. TSB will follow all the references and look for `tsbconfig.json` files next to each of the referenced tsconfig files.
