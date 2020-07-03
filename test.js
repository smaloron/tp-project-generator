var conf = {
  divisor: 2,
};

function danger() {
  conf.divisor = 0;
}

danger();

function calc(n) {
  if (conf.divisor != 0) {
    console.log(n / conf.divisor);
  } else {
    console.log(0);
  }
}

calc(5);
