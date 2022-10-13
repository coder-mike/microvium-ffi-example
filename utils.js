export function map(arr, f) {
  const result = [];
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    result[i] = f(arr[i], i);
  }
  return result;
}

export function join(arr, joiner) {
  if (joiner === undefined) joiner = ',';
  let result = '';
  const len = arr.length;
  if (len > 0) {
    result = arr[0];
  }
  for (let i = 1; i < len; i++) {
    result += joiner + arr[i];
  }
  return result;
}