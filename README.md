# cfn-parser

CloudFormation template parser.

## Installation

```
npm i cfn-parser
```

## makeTemplateParser(options = {})

- `options.anyResourceTypeParser`
  - A parser to parse a resource that is not defined in `options.resourceTypeParser`.
  - The parser must be a function that has arguments `(dataRef, context, callback)`.
- `options.resourceTypeParsers`
  - An object that defines parsers to parse CloudFormation resources.
  - A key of this object must be a string of a CloudFormation resource type.
  - A value of this object must be a function that has arguments `(dataRef, context, callback)`.
- `options.schemaMap`

This function returns the following function:

``` javascript
parser(template, context, callback)
```

- `template`
  - An object of CloudFormation template.
- `context`
- `callback(err, context)`
  - A function that is called when parsing template is completed, or an error occurs.

## License

MIT
