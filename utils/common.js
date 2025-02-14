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
