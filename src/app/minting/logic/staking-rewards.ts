export function getApyValues(years: number): {
  apyWithBonus: number;
  apyWithoutBonus: number;
} {
  const rewardTable = {
    one: 0.015,
    three: 0.075 / 3,
    five: 0.1875 / 5,
    ten: 0.5 / 10,
    fifteen: 0.825 / 15,
  };

  let apyWithoutBonus = 0;
  switch (years) {
    case 1: {
      apyWithoutBonus = rewardTable.one;
      break;
    }
    case 3: {
      apyWithoutBonus = rewardTable.three;
      break;
    }
    case 5: {
      apyWithoutBonus = rewardTable.five;
      break;
    }
    case 10: {
      apyWithoutBonus = rewardTable.ten;
      break;
    }
    case 15: {
      apyWithoutBonus = rewardTable.fifteen;
      break;
    }
  }

  return { apyWithoutBonus, apyWithBonus: apyWithoutBonus * 2 };
}
