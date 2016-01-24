// a transformer en constante ?
// export default function isServer() {
//   return typeof window === 'undefined' && typeof window.location === 'undefined';
// }

export default !(typeof window !== 'undefined' && typeof window.location !== 'undefined');
