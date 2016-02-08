export default function isPost(method) {
  const m = method.toLowerCase();
  return m === 'post' || m === 'put';
}
