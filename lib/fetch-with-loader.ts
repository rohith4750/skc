export const fetchWithLoader = async (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, init)
}
