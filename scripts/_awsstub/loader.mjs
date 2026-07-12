/* ESM resolve hook: redirect every @aws-sdk/* import to our stub, so lambda
   handlers can be imported and run with no real SDK installed. Registered via
   register.mjs (node --import ./scripts/_awsstub/register.mjs …). */
const stubUrl = new URL("./stub.mjs", import.meta.url).href;
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@aws-sdk/")) return { url: stubUrl, shortCircuit: true };
  return nextResolve(specifier, context);
}
