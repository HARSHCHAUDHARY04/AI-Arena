export interface TeamMemberDetails {
    id: string;
    name: string;
    role: 'Team Lead' | 'Member';
    course: string;
    rollNo: string;
    year: string;
    github?: string;
    linkedin?: string;
    phone: string;
    email?: string;
}

export interface TeamDetailsData {
    teamName: string;
    memberCount: number;
    isGlaStudent: boolean;
    campusOrCollege: string;
    members: TeamMemberDetails[];
}

export const MOCK_TEAMS: TeamDetailsData[] = [
    // Team 1: GLA University (Internal) - Main Demo
    {
        teamName: "Neural Ninjas",
        memberCount: 4,
        isGlaStudent: true,
        campusOrCollege: "GLA University, Mathura",
        members: [
            {
                id: "1",
                name: "Aarav Sharma",
                role: "Team Lead",
                course: "B.Tech CSE",
                rollNo: "2115000123",
                year: "3rd Year",
                github: "https://github.com/aaravs",
                linkedin: "https://linkedin.com/in/aaravs",
                phone: "+91 98765 43210",
                email: "aarav.sharma_cs21@gla.ac.in"
            },
            {
                id: "2",
                name: "Sneha Patel",
                role: "Member",
                course: "B.Tech CSE (AIML)",
                rollNo: "2115000456",
                year: "3rd Year",
                github: "https://github.com/snehap",
                phone: "+91 98765 12345"
            },
            {
                id: "3",
                name: "Rohan Gupta",
                role: "Member",
                course: "B.Tech CS",
                rollNo: "2115012789",
                year: "2nd Year",
                linkedin: "https://linkedin.com/in/rohang",
                phone: "+91 91234 56789"
            },
            {
                id: "4",
                name: "Ishita Singh",
                role: "Member",
                course: "B.Tech EC",
                rollNo: "2115000321",
                year: "3rd Year",
                phone: "+91 99887 76655"
            }
        ]
    },
    // Team 2: External University
    {
        teamName: "Code Crusaders",
        memberCount: 3,
        isGlaStudent: false,
        campusOrCollege: "IIT Delhi",
        members: [
            {
                id: "t2-1",
                name: "Vikram Malhotra",
                role: "Team Lead",
                course: "B.Tech CS",
                rollNo: "2021CS10234",
                year: "4th Year",
                github: "https://github.com/vikramm",
                linkedin: "https://linkedin.com/in/vikramm",
                phone: "+91 88888 77777",
                email: "vikram.m@iitd.ac.in"
            },
            {
                id: "t2-2",
                name: "Priya Das",
                role: "Member",
                course: "B.Tech Math & Computing",
                rollNo: "2021MC10456",
                year: "4th Year",
                github: "https://github.com/priyad",
                phone: "+91 77777 66666"
            },
            {
                id: "t2-3",
                name: "Arjun Reddy",
                role: "Member",
                course: "B.Tech EE",
                rollNo: "2021EE10789",
                year: "4th Year",
                linkedin: "https://linkedin.com/in/arjunr",
                phone: "+91 66666 55555"
            }
        ]
    },
    // Team 3: Another Internal Team
    {
        teamName: "Quantum Questers",
        memberCount: 4,
        isGlaStudent: true,
        campusOrCollege: "GLA University, Greater Noida",
        members: [
            {
                id: "t3-1",
                name: "Neha Kapoor",
                role: "Team Lead",
                course: "MCA",
                rollNo: "2200500123",
                year: "2nd Year",
                github: "https://github.com/nehak",
                phone: "+91 55555 44444",
                email: "neha.kapoor_mca22@gla.ac.in"
            },
            {
                id: "t3-2",
                name: "Rahul Verma",
                role: "Member",
                course: "B.Tech CSE",
                rollNo: "2115009876",
                year: "3rd Year",
                phone: "+91 44444 33333"
            },
            {
                id: "t3-3",
                name: "Simran Kaur",
                role: "Member",
                course: "B.Tech CSE",
                rollNo: "2115008765",
                year: "3rd Year",
                phone: "+91 33333 22222"
            },
            {
                id: "t3-4",
                name: "Aditya Kumar",
                role: "Member",
                course: "B.Tech CSE",
                rollNo: "2115007654",
                year: "3rd Year",
                phone: "+91 22222 11111"
            }
        ]
    },
    // Alias for seeded data "Team Alpha" (Mapped to Neural Ninjas data)
    {
        teamName: "Team Alpha",
        memberCount: 4,
        isGlaStudent: true,
        campusOrCollege: "GLA University, Mathura",
        members: [
            {
                id: "1",
                name: "Aarav Sharma",
                role: "Team Lead",
                course: "B.Tech CSE",
                rollNo: "2115000123",
                year: "3rd Year",
                github: "https://github.com/aaravs",
                linkedin: "https://linkedin.com/in/aaravs",
                phone: "+91 98765 43210",
                email: "aarav.sharma_cs21@gla.ac.in"
            },
            // ... same as Neural Ninjas
            {
                id: "2",
                name: "Sneha Patel",
                role: "Member",
                course: "B.Tech CSE (AIML)",
                rollNo: "2115000456",
                year: "3rd Year",
                github: "https://github.com/snehap",
                phone: "+91 98765 12345"
            },
            {
                id: "3",
                name: "Rohan Gupta",
                role: "Member",
                course: "B.Tech CS",
                rollNo: "2115012789",
                year: "2nd Year",
                linkedin: "https://linkedin.com/in/rohang",
                phone: "+91 91234 56789"
            },
            {
                id: "4",
                name: "Ishita Singh",
                role: "Member",
                course: "B.Tech EC",
                rollNo: "2115000321",
                year: "3rd Year",
                phone: "+91 99887 76655"
            }
        ]
    },
    // Alias for seeded data "Team Beta" (Mapped to Code Crusaders data)
    {
        teamName: "Team Beta",
        memberCount: 3,
        isGlaStudent: false,
        campusOrCollege: "IIT Delhi",
        members: [
            {
                id: "t2-1",
                name: "Vikram Malhotra",
                role: "Team Lead",
                course: "B.Tech CS",
                rollNo: "2021CS10234",
                year: "4th Year",
                github: "https://github.com/vikramm",
                linkedin: "https://linkedin.com/in/vikramm",
                phone: "+91 88888 77777",
                email: "vikram.m@iitd.ac.in"
            },
            {
                id: "t2-2",
                name: "Priya Das",
                role: "Member",
                course: "B.Tech Math & Computing",
                rollNo: "2021MC10456",
                year: "4th Year",
                github: "https://github.com/priyad",
                phone: "+91 77777 66666"
            },
            {
                id: "t2-3",
                name: "Arjun Reddy",
                role: "Member",
                course: "B.Tech EE",
                rollNo: "2021EE10789",
                year: "4th Year",
                linkedin: "https://linkedin.com/in/arjunr",
                phone: "+91 66666 55555"
            }
        ]
    }
];
