
const dashboardCounts = {
    waiting: 5,
    visitedToken: 10,
    completed: 3
    // inConsultation is missing
};

const total = dashboardCounts?.waiting + dashboardCounts?.completed + dashboardCounts?.inConsultation || 0;
console.log("Total with missing inConsultation:", total);

const dashboardCounts2 = {
    waiting: 5,
    visitedToken: 10,
    completed: 3,
    inConsultation: 2
};

const total2 = dashboardCounts2?.waiting + dashboardCounts2?.completed + dashboardCounts2?.inConsultation || 0;
console.log("Total with inConsultation:", total2);

const dashboardCounts3 = {
    waiting: 5,
    completed: 3,
    inConsultation: null
}
const total3 = dashboardCounts3?.waiting + dashboardCounts3?.completed + dashboardCounts3?.inConsultation || 0;
console.log("Total with null inConsultation:", total3);
