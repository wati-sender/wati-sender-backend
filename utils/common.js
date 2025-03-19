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

// current date - 2 months
export const getEndOfLastMonthUTC = () => {
  const lastMonth = new Date();
  lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1); // Subtract 1 month
  lastMonth.setUTCHours(23, 59, 59, 0); // Set time to 23:59:59.000 UTC
  return lastMonth.toISOString();
};

export function escapeRegExpChars(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


export const distributeContactsToAccounts = (contacts, accounts) => {
  const numAccounts = accounts.length;
  const contactsPerAccount = Math.floor(contacts.length / numAccounts); // Base number of contacts per account
  let remainingContacts = contacts.length % numAccounts; // Remainder contacts that will be distributed evenly

  let accountIndex = 0;
  const accountBatches = accounts.map(account => ({
    account_id: account._id,
    username: account.username,
    token: account?.token,
    loginUrl: account?.loginUrl,
    password: account?.password,
    contacts: []
  }));

  // Distribute contacts evenly across accounts
  contacts.forEach((contact, index) => {
    // Add the contact to the current account's batch
    accountBatches[accountIndex].contacts.push(contact);

    // Move to the next account
    accountIndex = (accountIndex + 1) % numAccounts;
  });

  return accountBatches;
};



