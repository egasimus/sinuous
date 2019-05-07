import test from 'tape';
import { spy } from 'sinon';
import o, { S, subscribe } from '../src/observable.js';

test('initial value can be set', function(t) {
  let title = o('Groovy!');
  t.equal(title(), 'Groovy!');
  t.end();
});

test('runs function on subscribe', function(t) {
  subscribe(t.pass);
  t.end();
});

test('observable can be set without subscription', function(t) {
  let title = o();
  title('Groovy!');
  t.equal(title(), 'Groovy!');
  t.end();
});

test('updates when the observable is set', function(t) {
  let title = o();
  let text;
  subscribe(() => (text = title()));

  title('Welcome to Sinuous!');
  t.equal(text, 'Welcome to Sinuous!');

  title('Groovy!');
  t.equal(text, 'Groovy!');

  t.end();
});

test('observable unsubscribe', function(t) {
  let title = o('Initial title');
  let text;
  const unsubscribe = subscribe(() => (text = title()));

  title('Welcome to Sinuous!');
  t.equal(text, 'Welcome to Sinuous!');

  unsubscribe();

  title('Groovy!');
  t.equal(text, 'Welcome to Sinuous!');

  t.end();
});

test('nested subscribe', function(t) {
  let apple = o('apple');
  let lemon = o('lemon');
  let onion = o('onion');
  let tempApple;
  let tempLemon;
  let tempOnion;
  const unsubscribes = [];

  let veggieSpy;
  const fruitSpy = spy(() => {
    tempApple = apple();

    veggieSpy = spy(() => {
      tempOnion = onion();
    });

    unsubscribes.push(subscribe(veggieSpy));

    tempLemon = lemon();
  });

  unsubscribes.push(subscribe(fruitSpy));

  t.equal(tempApple, 'apple');
  t.equal(tempLemon, 'lemon');
  t.equal(tempOnion, 'onion');
  t.assert(fruitSpy.calledOnce);
  t.assert(veggieSpy.calledOnce);

  onion('peel');
  t.equal(tempOnion, 'peel');
  t.assert(fruitSpy.calledOnce);
  t.assert(veggieSpy.calledTwice);

  lemon('juice');
  t.equal(tempLemon, 'juice');
  t.assert(fruitSpy.calledTwice);
  // this will be a new spy that was executed once
  t.assert(veggieSpy.calledOnce);

  t.end();
});

test('nested subscribe cleans up inner subscriptions', function(t) {
  let apple = o('apple');
  let lemon = o('lemon');
  let grape = o('grape');
  let onion = o('onion');
  let bean = o('bean');
  let carrot = o('carrot');
  let onions = '';
  let beans = '';
  let carrots = '';

  subscribe(() => {
    apple();
    subscribe(() => (onions += onion()));
    grape();
    subscribe(() => (beans += bean()));
    subscribe(() => (carrots += carrot()));
    lemon();
  });

  apple('juice');
  lemon('juice');
  grape('juice');

  bean('bean');

  t.equal(onions, 'onion'.repeat(4));
  t.equal(beans, 'bean'.repeat(5));
  t.end();
});

// Tests from S.js

test("updates when S.data is set", function (t) {
  var d = o(1),
      fevals = 0;

  S(function () { fevals++; return d(); });
  fevals = 0;

  d(1);
  t.equal(fevals, 1);
  t.end();
});

test("does not update when S.data is read", function (t) {
  var d = o(1),
      fevals = 0;

  S(function () { fevals++; return d(); });
  fevals = 0;

  d();
  t.equal(fevals, 0);
  t.end();
});

test("updates return value", function (t) {
  var d = o(1),
      f = S(function () { fevals++; return d(); });

  d(2);
  t.equal(f(), 2);
  t.end();
});

var i, j, e, fevals, f;

function intest() {
  i = o(true);
  j = o(1);
  e = o(2);
  fevals = 0;
  f = S(function () { fevals++; return i() ? j() : e(); });
  fevals = 0;
}

test("updates on active dependencies", function (t) {
  intest();
  j(5);
  t.equal(fevals, 1);
  t.equal(f(), 5);
  t.end();
});

test("does not update on inactive dependencies", function (t) {
  intest();
  e(5);
  t.equal(fevals, 0);
  t.equal(f(), 1);
  t.end();
});

test("deactivates obsolete dependencies", function (t) {
  intest();
  i(false);
  fevals = 0;
  j(5);
  t.equal(fevals, 0);
  t.end();
});

test("activates new dependencies", function (t) {
  intest();
  i(false);
  fevals = 0;
  e(5);
  t.equal(fevals, 1);
  t.end();
});

test("insures that new dependencies are updated before dependee", function (t) {
  var order = "",
      a = o(0),
      b = S(function x() { order += "b"; return a() + 1; }),
      c = S(function y() { order += "c"; return b() || d(); }),
      d = S(function z() { order += "d"; return a() + 10; });

  t.equal(order, "bcd", '1st bcd test');

  order = "";
  a(-1);

  t.equal(b(), 0, 'b equals 0');
  t.equal(order, "bcd", '2nd bcd test');
  t.equal(d(), 9, 'd equals 9');
  t.equal(c(), 9, 'c equals d(9)');

  order = "";
  a(0);

  t.equal(order, "bcd", '3rd bcd test');
  t.equal(c(), 1);
  t.end();
});

test("propagates in topological order", function (t) {
  //
  //     c1
  //    /  \
  //   /    \
  //  b1     b2
  //   \    /
  //    \  /
  //     a1
  //
  var seq = "",
      a1 = o(true),
      b1 = S(function () { a1();       seq += "b1"; }),
      b2 = S(function () { a1();       seq += "b2"; }),
      c1 = S(function () { b1(), b2(); seq += "c1"; });

  seq = "";
  a1(true);

  t.equal(seq, "b1b2c1");
  t.end();
});
