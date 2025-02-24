// export const isPhoneNumber = (phone) => {
//   try {
//     return phoneUtil.isValidNumber(phoneUtil.parse(phone));
//   } catch (error) {
//     console.error("isPhoneNumber: Error:", error.message);
//     return false;
//   }
// };

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

export const getEndOfTodayUTC = () => {
  const today = new Date();
  today.setUTCHours(23, 59, 59, 0); // Set time to 23:59:59.000 UTC
  return today.toISOString();
};
