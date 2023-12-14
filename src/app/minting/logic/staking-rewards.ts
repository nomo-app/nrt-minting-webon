// we use bigint years because we do not want to deal with floating point year values
export function getApyValues(years: bigint): {
  apyWithBonus: number;
  apyWithoutBonus: number;
} {
  const rewardTable = {
    one: 0.015,
    three: 0.075 / 3,
    five: 0.1875 / 5,
    ten: 0.5 / 10,
  };

  let apyWithoutBonus = 0;
  switch (years) {
    case 1n: {
      apyWithoutBonus = rewardTable.one;
      break;
    }
    case 3n: {
      apyWithoutBonus = rewardTable.three;
      break;
    }
    case 5n: {
      apyWithoutBonus = rewardTable.five;
      break;
    }
    case 10n: {
      apyWithoutBonus = rewardTable.ten;
      break;
    }
    default: {
      throw new Error("Invalid year value for APY calculation: " + years);
    }
  }

  return { apyWithoutBonus, apyWithBonus: apyWithoutBonus * 2 };
}
