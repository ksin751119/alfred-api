module.exports = {
  extends: [],
  rules: {
    "max-len": [
      "error",
      {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignorePattern: "class [a-zA-Z]+",
      },
    ],
  },
};
