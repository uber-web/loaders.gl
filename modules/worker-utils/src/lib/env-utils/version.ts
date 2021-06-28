// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
// __VERSION__ is injected by babel-plugin-version-inline
declare let __VERSION__;
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
if (typeof __VERSION__ === 'undefined') {
  console.error(
    'loaders.gl: The __VERSION__ variable is not injected using babel-plugin-version-inline. Latest unstable workers would be fetched from the CDN.'
  );
}
