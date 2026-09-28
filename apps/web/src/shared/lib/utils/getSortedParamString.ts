export const getSortedParamString = (params: URLSearchParams) => {
  const searchParams = new URLSearchParams();
  const filtersObject = Object.fromEntries(params.entries());
  Object.keys(filtersObject)
    .sort()
    .forEach((key) => searchParams.set(key, filtersObject[key]!));

  return searchParams.toString();
};
