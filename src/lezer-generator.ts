import {buildParserFile, GenError} from ".."

let file = undefined, out = undefined, includeNames = false, exportName = undefined, noTerms = false
let moduleStyle: "es" | "cjs" = "es"

let {writeFileSync, readFileSync} = require("fs")

const usage = "Usage: build-parser [--cjs] [--names] [--noTerms] [--output outfile] [--export name] file"

for (let i = 2; i < process.argv.length;) {
  let arg = process.argv[i++]
  if (!/^-/.test(arg)) {
    if (file) error("Multiple input files given")
    file = arg
  } else if (arg == "--help") {
    console.log(usage)
    process.exit(0)
  } else if (arg == "--cjs") {
    moduleStyle = "cjs"
  } else if (arg == "-o" || arg == "--output") {
    if (out) error("Multiple output files given")
    out = process.argv[i++]
  } else if (arg == "--names") {
    includeNames = true
  } else if (arg == "--export") {
    exportName = process.argv[i++]
  } else if (arg == "--noTerms") {
    noTerms = true
  } else {
    error("Unrecognized option " + arg)
  }
}

if (!file) error("No input file given")

function error(msg: string) {
  console.error(msg)
  console.log(usage)
  process.exit(1)
}

let parser, terms
try {
  ;({parser, terms} = buildParserFile(readFileSync(file, "utf8"), {fileName: file, moduleStyle, includeNames, exportName}))
} catch (e) {
  console.error(e instanceof GenError ? e.message : e.stack)
  process.exit(1)
}

/// Split a file into its basename and extension. E.g. "foo.bar" -> ["foo", "bar"]. If
/// a file has no extension the extension is "". If it has multiple only the last extension
/// is used, i.e. "foo" -> ["foo", ""]; "foo.bar.baz" -> ["foo.bar", "baz"].
function splitFileExt(filename: string): [string, string] {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) {
    return [filename, ""];
  }
  return [filename.slice(0, lastDot), filename.slice(lastDot + 1)];
}

if (out) {
  const [base, ext] = splitFileExt(out);

  let [parserFile, termFile] =
      (ext === "js" || ext === "ts")
      ? [`${base}.${ext}`, `${base}.terms.${ext}`]
      : [`${out}.js`, `${out}.terms.js`];
 
  writeFileSync(parserFile, parser)
  if (!noTerms) writeFileSync(termFile, terms)
  console.log(`Wrote ${parserFile}${noTerms ? "" : ` and ${termFile}`}`)
} else {
  console.log(parser)
}
