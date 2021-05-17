# TypeScript Build

**Copy files to output directory after TSC build**

TypeScript Build (tsb) will run `tsc` with the arguments passed to `tsb` and copy files based on a config if present.

## Install

```
npm install --dev typescript typescript-build
```

or

```
yarn add --dev typescript typescript-build
```

## Usage

1. Next to your `tsconfig.json` create a `tsbconfig.json` as described below.
1. Run the `tsb` command as you would `tsc`.

### Example

```json
{
  "copyFiles": [
    {
      "files": ["src/**/*.css"],
      "outDirectory": "dist",
      "up": 1
    }
  ]
}
```

- `files`: array of [globs](https://github.com/isaacs/node-glob) to match and copy to `outDirectory`
- `outDirectory`: the output directory relative to the directory of the `tsbconfig.json` file
- `up`: (optional) number of directories to remove from the matches.

Let's say you have a `tsconfig.json` file with `"outDir": "dist"` and the above `tsbconfig.json` in the same directory, and you run `tsb --build` the following will happen:

1. TSB will execute `tsc --build`
1. If `tsc` succeeds, it will copy all of the css files from the src directory info the dist directory matching the directory, but removing one level form the matches. (e.g. `src/papaya/coolcss.css` will be copied to `dist/papaya/coolcss.css`)

In the case of `tsb --build --clean` it will:

1. Execute `tsc --build --clean`
1. If `tsc` succeeds, it will delete the `outDirectory` and all of its content.

## FAQ

- Why is nothing happening?
  - `tsb` will only perform the copy of files if the `--build` options is used and the clean-up if both `--build` and `--clean` options are used.
- Will it follow references?
  - Yes. TSB will follow all the references and look for `tsbconfig.json` files next to each of the referenced tsconfig files.
