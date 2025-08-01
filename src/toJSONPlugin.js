export function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
    },
  });
}
