
export const SUBJECT_CONSTANT = [
  // ================= UP BOARD =================
  {
    board: "UP",
    boardName: "UP Board",
    classes: [
      // Class 5 to 8
      ...[5, 6, 7, 8].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "EVS", name: "Environmental Studies" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "SAN", name: "Sanskrit" },
          { id: "COM", name: "Computer" },
          { id: "ART", name: "Art & Drawing" },
          { id: "PE", name: "Physical Education" },
        ],
      })),

      // Class 9 and 10
      ...[9, 10].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "SAN", name: "Sanskrit" },
          { id: "URD", name: "Urdu" },
          { id: "AGR", name: "Agriculture" },
          { id: "HOM", name: "Home Science" },
          { id: "ART", name: "Drawing" },
        ],
      })),

      // Class 11 and 12
      ...[11, 12].map((classNo) => ({
        class: classNo,
        streams: [
          {
            stream: "Science",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "PHY", name: "Physics" },
              { id: "CHE", name: "Chemistry" },
              { id: "MAT", name: "Mathematics" },
              { id: "BIO", name: "Biology" },
              { id: "CS", name: "Computer Science" },
              { id: "PE", name: "Physical Education" },
              { id: "AGR", name: "Agriculture" },
            ],
          },
          {
            stream: "Commerce",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "ACC", name: "Accountancy" },
              { id: "BST", name: "Business Studies" },
              { id: "ECO", name: "Economics" },
              { id: "MAT", name: "Mathematics" },
              { id: "CS", name: "Computer Science" },
            ],
          },
          {
            stream: "Arts",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "HIS", name: "History" },
              { id: "GEO", name: "Geography" },
              { id: "POL", name: "Political Science" },
              { id: "ECO", name: "Economics" },
              { id: "SOC", name: "Sociology" },
              { id: "SAN", name: "Sanskrit" },
              { id: "PSY", name: "Psychology" },
              { id: "HOM", name: "Home Science" },
              { id: "PA", name: "Public Administration" },
            ],
          },
        ],
      })),
    ],
  },

  // ================= PUNJAB BOARD =================
  {
    board: "PSEB",
    boardName: "Punjab Board",
    classes: [
      ...[5, 6, 7, 8].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "PUN", name: "Punjabi" },
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "COM", name: "Computer Science" },
          { id: "ART", name: "Art & Drawing" },
          { id: "PE", name: "Physical Education" },
        ],
      })),

      ...[9, 10].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "PUN", name: "Punjabi" },
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "URD", name: "Urdu" },
          { id: "AGR", name: "Agriculture" },
          { id: "COM", name: "Computer Science" },
        ],
      })),

      ...[11, 12].map((classNo) => ({
        class: classNo,
        streams: [
          {
            stream: "Science",
            subjects: [
              { id: "PUN", name: "Punjabi" },
              { id: "ENG", name: "English" },
              { id: "PHY", name: "Physics" },
              { id: "CHE", name: "Chemistry" },
              { id: "MAT", name: "Mathematics" },
              { id: "BIO", name: "Biology" },
              { id: "CS", name: "Computer Science" },
              { id: "PE", name: "Physical Education" },
            ],
          },
          {
            stream: "Commerce",
            subjects: [
              { id: "PUN", name: "Punjabi" },
              { id: "ENG", name: "English" },
              { id: "ACC", name: "Accountancy" },
              { id: "BST", name: "Business Studies" },
              { id: "ECO", name: "Economics" },
              { id: "MAT", name: "Mathematics" },
              { id: "CS", name: "Computer Science" },
            ],
          },
          {
            stream: "Arts",
            subjects: [
              { id: "PUN", name: "Punjabi" },
              { id: "ENG", name: "English" },
              { id: "HIS", name: "History" },
              { id: "GEO", name: "Geography" },
              { id: "POL", name: "Political Science" },
              { id: "ECO", name: "Economics" },
              { id: "SOC", name: "Sociology" },
              { id: "PSY", name: "Psychology" },
              { id: "HIN", name: "Hindi" },
              { id: "SAN", name: "Sanskrit" },
              { id: "PA", name: "Public Administration" },
            ],
          },
        ],
      })),
    ],
  },

  // ================= RAJASTHAN BOARD =================
  {
    board: "RBSE",
    boardName: "Rajasthan Board",
    classes: [
      ...[5, 6, 7, 8].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "SAN", name: "Sanskrit" },
          { id: "URD", name: "Urdu" },
          { id: "COM", name: "Computer" },
          { id: "ART", name: "Art & Drawing" },
          { id: "PE", name: "Physical Education" },
        ],
      })),

      ...[9, 10].map((classNo) => ({
        class: classNo,
        subjects: [
          { id: "HIN", name: "Hindi" },
          { id: "ENG", name: "English" },
          { id: "MAT", name: "Mathematics" },
          { id: "SCI", name: "Science" },
          { id: "SST", name: "Social Science" },
          { id: "SAN", name: "Sanskrit" },
          { id: "URD", name: "Urdu" },
          { id: "AGR", name: "Agriculture" },
          { id: "ART", name: "Drawing" },
        ],
      })),

      ...[11, 12].map((classNo) => ({
        class: classNo,
        streams: [
          {
            stream: "Science",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "PHY", name: "Physics" },
              { id: "CHE", name: "Chemistry" },
              { id: "MAT", name: "Mathematics" },
              { id: "BIO", name: "Biology" },
              { id: "CS", name: "Computer Science" },
              { id: "IP", name: "Informatics Practices" },
              { id: "PE", name: "Physical Education" },
            ],
          },
          {
            stream: "Commerce",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "ACC", name: "Accountancy" },
              { id: "BST", name: "Business Studies" },
              { id: "ECO", name: "Economics" },
              { id: "MAT", name: "Mathematics" },
              { id: "IP", name: "Informatics Practices" },
            ],
          },
          {
            stream: "Arts",
            subjects: [
              { id: "HIN", name: "Hindi" },
              { id: "ENG", name: "English" },
              { id: "HIS", name: "History" },
              { id: "GEO", name: "Geography" },
              { id: "POL", name: "Political Science" },
              { id: "ECO", name: "Economics" },
              { id: "SOC", name: "Sociology" },
              { id: "PSY", name: "Psychology" },
              { id: "SAN", name: "Sanskrit" },
              { id: "PA", name: "Public Administration" },
              { id: "RAJ", name: "Rajasthani Literature" },
              { id: "PE", name: "Physical Education" },
            ],
          },
        ],
      })),
    ],
  },
];
