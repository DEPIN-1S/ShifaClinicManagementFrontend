export const calculateDetailedAge = (dob) => {
    if (!dob) return "";

    const birthDate = new Date(dob);
    const today = new Date();

    // Check if valid date
    if (isNaN(birthDate.getTime())) return dob; // Return as is if not a valid date string (might be pre-calculated age)

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust for negative days (borrow from previous month)
    if (days < 0) {
        months--;
        // Get days in the previous month
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    // Adjust for negative months (borrow from previous year)
    if (months < 0) {
        years--;
        months += 12;
    }

    if (years > 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    if (months > 0) {
        return `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    return `${days} ${days === 1 ? 'day' : 'days'}`;
};
