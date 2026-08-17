// CSS imports are handled by Metro at bundle time; declare them for TypeScript.
declare module "*.css";
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
