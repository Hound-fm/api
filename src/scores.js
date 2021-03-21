export const POPULAR_SCORE = {
  functions: [
    {
      field_value_factor: {
        field: "repost_count",
        factor: 1.5,
        modifier: "sqrt",
        missing: 1,
      },
    },
    {
      field_value_factor: {
        field: "view_count",
        factor: 1.05,
        modifier: "log1p",
        missing: 1,
      },
    },
    {
      linear: {
        discovered_at: {
          scale: "240d",
          decay: 0.08,
        },
      },
    },
  ],
};
