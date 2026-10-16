/**
*
* 파일명 : counter.ts
* 역할 : Vite 기본 카운터 예제의 클릭 동작을 정의하는 파일
* 생성일 : 2026-09-17
*
**/

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
