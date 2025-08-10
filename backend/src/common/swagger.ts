// A tiny wrapper to export decorators if @nestjs/swagger is available.
// If not, provides no-op decorators to keep build working.

// eslint-disable-next-line @typescript-eslint/ban-types
function makeNoopDecorator(): Function {
  return (..._args: any[]) => {
    // no-op decorator
    return (_target: any, _propertyKey?: string, _descriptor?: PropertyDescriptor) => {};
  };
}

let ApiProperty: any = makeNoopDecorator();
let ApiTags: any = makeNoopDecorator();
let ApiOkResponse: any = makeNoopDecorator();

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sw: any = require('@nestjs/swagger');
  ApiProperty = sw.ApiProperty;
  ApiTags = sw.ApiTags;
  ApiOkResponse = sw.ApiOkResponse;
} catch {
  // keep no-ops
}

export { ApiProperty, ApiTags, ApiOkResponse };
