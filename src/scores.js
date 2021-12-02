export const POPULAR_SCORE = [
  {
    field_value_factor: {
      field: "reposted",
      factor: 0.25,
      modifier: "sqrt",
      missing: 0,
    },
  },
  {
    field_value_factor: {
      field: "view_count",
      factor: 0.025,
      modifier: "sqrt",
      missing: 0,
    },
  },
  {
    field_value_factor: {
      field: "likes_count",
      factor: 1.25,
      modifier: "sqrt",
      missing: 0,
    },
  },
  /*{
    linear: {
      release_date: {
        scale: "100d",
        origin: "0d",
        decay: 0.08,
      },
    },
  },*/
];
