import S from 's-js';
import sinuous from 'sinuous';
import htm from 'htm';

const h = sinuous(S);
const html = htm.bind(h);
const randomColor = () => '#' + ((Math.random() * (1 << 24)) | 0).toString(16);

const count = S.data(0);
const style = S.data({});
const onclick = S.data(clicked);

function clicked() {
  onclick(false);
  console.log('removed click handler');
}

let list = S.data([
  'bread',
  'milk',
  'honey',
  'chips',
  'cookie'
]);

const template = () => {
  return html`
    <div>
      <h1 style=${style}>
        Sinuous <sup>${count}</sup>
        <div>${() => count() + count()}</div>
        <button onclick="${onclick}">Click</button>
      </h1>
      <ul>
        ${() => list().map((item) => html`<li>${item}</li>`)}
      </ul>
    </div>
  `;
};

S.root(() => document.querySelector('.sinuous').append(template()));
setInterval(() => {
  style({ color: randomColor() });
  count(count() + 1);
  list(list().slice());
}, 1000);

// function shuffle(array) {
//   return array.sort(() => Math.random() - 0.5);
// }
