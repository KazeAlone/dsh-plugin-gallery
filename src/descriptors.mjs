const json = {
  mode: "strict",
  typeSymbol: "dsh-plugin-gallery#Json",
  create: () => ({ parse: (x) => x }),
};
const string = (name) => ({
  name,
  wire: name,
  source: "json",
  codec: {
    mode: "strict",
    typeSymbol: "dsh-plugin-gallery#String",
    create: () => ({
      parse: (x) => {
        if (typeof x !== "string" || x.length > 8 * 1024 * 1024)
          throw new TypeError("Invalid Gallery argument");
        return x;
      },
    }),
  },
});
const methods = {
  uiStatus: [],
  uiList: ["payload"],
  uiGet: ["id"],
  uiCreate: ["payload"],
  uiUpdate: ["id", "payload"],
  uiEnroll: ["payload"],
  uiClearIdentity: [],
};
export const DESCRIPTORS = Object.entries(methods).map(([method, names]) => ({
  id: `dsh-plugin-gallery#gallery/${method}`,
  service: "gallery",
  namespace: "gallery",
  method,
  invocation: { kind: "direct" },
  parameters: names.map(string),
  result: json,
}));
export const REMOTE = {
  package: "dsh-plugin-gallery",
  descriptors: DESCRIPTORS,
};
