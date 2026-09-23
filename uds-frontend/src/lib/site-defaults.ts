/**
 * Default website content.
 *
 * This is the single source of truth for what the public site shows before an
 * admin edits anything: the section components render these, and the CMS editor
 * seeds its forms from them. Saved CMS content is merged over the top, so any
 * field an admin has not touched keeps the value here.
 *
 * Generated from the original hardcoded section data.
 */

import type { SiteContent } from "@/lib/site-content";

export const DEFAULT_CONTENT: SiteContent = {
  "hero": {
    "fields": {
      "badge": "University of Lagos · Faculty of Engineering",
      "headline": "Innovate.",
      "headlineAccent": "Engineer.",
      "headlineEnd": "Transform.",
      "subheadline": "The UNILAG Design Studio is a smart innovation hub where students, researchers, and engineers build tomorrow’s solutions using cutting-edge tools, IoT hardware, and AI-powered resources.",
      "aboutText": "UNILAG Design Studio is a smart innovation hub for engineering education, laboratory operations and student project development — combining an intelligent inventory system, IoT-enabled hardware and an AI-powered project ideation engine into one scalable studio infrastructure."
    },
    "items": [
      {
        "value": "200+",
        "label": "Students Trained"
      },
      {
        "value": "50+",
        "label": "Projects Built"
      },
      {
        "value": "500+",
        "label": "Components"
      },
      {
        "value": "15+",
        "label": "Industry Partners"
      }
    ]
  },
  "projects": {
    "fields": {
      "heading": "Building real solutions for real problems",
      "subheading": ""
    },
    "items": [
      {
        "title": "Smart Traffic Management System",
        "description": "An IoT-powered traffic control system using computer vision and ESP32 microcontrollers to dynamically optimise traffic flow at intersections.",
        "tags": "IoT, Computer Vision, ESP32",
        "team": "4",
        "status": "Completed",
        "color": "hsl(85 35% 38%)"
      },
      {
        "title": "AgriSense — IoT Agriculture Monitor",
        "description": "Wireless sensor network that tracks soil moisture, temperature, and crop health in real-time, sending alerts to farmers via a mobile dashboard.",
        "tags": "Agriculture, IoT, Sensors",
        "team": "3",
        "status": "Active",
        "color": "hsl(9 55% 32%)"
      },
      {
        "title": "Solar-Powered Water Purifier",
        "description": "A low-cost, solar-driven water purification unit designed for off-grid communities. Uses UV-C LEDs and carbon filtration stages.",
        "tags": "Renewable Energy, Hardware",
        "team": "5",
        "status": "Completed",
        "color": "hsl(41 87% 44%)"
      },
      {
        "title": "Gesture-Controlled Wheelchair",
        "description": "An EMG and accelerometer-based control interface allowing physically impaired users to navigate a motorised wheelchair using hand gestures.",
        "tags": "Health Tech, Embedded Systems",
        "team": "4",
        "status": "Active",
        "color": "hsl(25 70% 45%)"
      },
      {
        "title": "Campus Air Quality Monitor",
        "description": "Distributed sensor nodes across UNILAG campus measuring PM2.5, CO₂, and VOC levels. Data is visualised on a live public dashboard.",
        "tags": "Environmental, Data Analytics",
        "team": "3",
        "status": "Active",
        "color": "hsl(342 43% 35%)"
      },
      {
        "title": "Automated Greenhouse Controller",
        "description": "Raspberry Pi-based system that controls irrigation, lighting, and ventilation in a greenhouse based on plant-specific environmental thresholds.",
        "tags": "Automation, Agriculture",
        "team": "3",
        "status": "Completed",
        "color": "hsl(18 29% 52%)"
      }
    ]
  },
  "research": {
    "fields": {
      "heading": "Pushing the boundary of engineering knowledge",
      "subheading": ""
    },
    "items": [
      {
        "icon": "Cpu",
        "name": "Embedded Systems Lab",
        "focus": "Microcontrollers · FPGA · RTOS · IoT Protocols",
        "description": "Researching low-power embedded architectures for resource-constrained environments. Current work includes RTOS optimisation for ESP32 clusters and custom PCB design for industrial sensing applications.",
        "papers": "8",
        "members": "12"
      },
      {
        "icon": "Leaf",
        "name": "Renewable Energy Research Group",
        "focus": "Solar PV · Energy Storage · Smart Grids",
        "description": "Investigating sustainable energy systems tailored for the West African climate. Projects span solar micro-grids, battery management systems, and energy-efficient building automation for Nigerian campuses.",
        "papers": "6",
        "members": "9"
      },
      {
        "icon": "Brain",
        "name": "AI & Robotics Group",
        "focus": "Machine Learning · Computer Vision · Autonomous Systems",
        "description": "Developing AI-driven control systems for robotic platforms. Active research areas include object detection on edge devices, reinforcement learning for robot navigation, and natural language interfaces for assistive robots.",
        "papers": "10",
        "members": "15"
      },
      {
        "icon": "FlaskConical",
        "name": "Health Technology Initiative",
        "focus": "Biomedical Devices · Diagnostics · Wearables",
        "description": "Creating affordable diagnostic tools and wearable health monitors adapted for low-resource healthcare settings. Current projects include a portable ECG monitor and an AI-assisted malaria detection microscope.",
        "papers": "4",
        "members": "7"
      }
    ]
  },
  "outreach": {
    "fields": {
      "heading": "Engineering impact beyond the campus",
      "subheading": ""
    },
    "items": [
      {
        "icon": "School",
        "title": "Secondary School STEM Outreach",
        "description": "Monthly visits to Lagos secondary schools, delivering hands-on electronics workshops and inspiring the next generation of engineers through practical experiments.",
        "reach": "20+ schools",
        "frequency": "Monthly"
      },
      {
        "icon": "Heart",
        "title": "Community Tech Clinic",
        "description": "Free electronics repair and diagnostics clinic open to UNILAG staff, students, and the surrounding community every Saturday morning.",
        "reach": "500+ beneficiaries",
        "frequency": "Weekly"
      },
      {
        "icon": "Wrench",
        "title": "Maker Saturdays",
        "description": "Open workshop sessions where anyone can come in, use studio equipment, and get mentorship from senior students and faculty on their personal projects.",
        "reach": "Open to all",
        "frequency": "Bi-weekly"
      },
      {
        "icon": "Globe",
        "title": "Pan-African Innovation Exchange",
        "description": "Virtual and in-person programme connecting engineering students across African universities to collaborate on shared challenges and share resources.",
        "reach": "8 universities",
        "frequency": "Quarterly"
      }
    ]
  },
  "internships": {
    "fields": {
      "heading": "Start your engineering career here",
      "subheading": ""
    },
    "items": [
      {
        "title": "Electronics Design Intern",
        "type": "Part-time",
        "duration": "3 months",
        "location": "On-site · UNILAG",
        "skills": "PCB Design, KiCad, Soldering",
        "description": "Assist the hardware team in designing and prototyping PCBs for ongoing IoT projects. Gain hands-on experience with professional EDA tools and design-for-manufacture processes.",
        "open": "true"
      },
      {
        "title": "Embedded Firmware Developer",
        "type": "Part-time",
        "duration": "3–6 months",
        "location": "Hybrid",
        "skills": "C/C++, ESP32, RTOS",
        "description": "Write and test firmware for microcontroller-based systems. You will work alongside the Embedded Systems Lab on real sensor and actuator integration projects.",
        "open": "true"
      },
      {
        "title": "Research Assistant — AI & Robotics",
        "type": "Part-time",
        "duration": "6 months",
        "location": "On-site · UNILAG",
        "skills": "Python, TensorFlow, ROS",
        "description": "Support ongoing computer vision and autonomous navigation research. Help collect datasets, run experiments, and document results for publication.",
        "open": "true"
      },
      {
        "title": "Web & Dashboard Developer",
        "type": "Part-time",
        "duration": "3 months",
        "location": "Remote-friendly",
        "skills": "React, Next.js, TypeScript",
        "description": "Build and improve the studio's internal web platform and data dashboards. This role directly contributes to the Smart Inventory and Analytics systems.",
        "open": "false"
      }
    ]
  },
  "events": {
    "fields": {
      "heading": "Learn, build, and connect",
      "subheading": ""
    },
    "items": [
      {
        "day": "15",
        "month": "Jun",
        "title": "Arduino Fundamentals Workshop",
        "time": "10:00 AM – 3:00 PM",
        "location": "Design Studio, ENG Building",
        "type": "Workshop",
        "typeColor": "hsl(9 55% 32%)",
        "description": "A hands-on beginner workshop covering Arduino programming, sensor interfacing, and your first embedded project. Materials provided.",
        "spots": "20 spots remaining"
      },
      {
        "day": "01",
        "month": "Jul",
        "title": "Innovation Hackathon 2026",
        "time": "8:00 AM – 8:00 PM (3 days)",
        "location": "UNILAG Faculty of Engineering",
        "type": "Hackathon",
        "typeColor": "hsl(25 70% 45%)",
        "description": "48-hour engineering hackathon open to all UNILAG students. Build hardware or software solutions for one of three challenge tracks. Prizes worth ₦500,000.",
        "spots": "Teams of 3–5"
      },
      {
        "day": "20",
        "month": "Jul",
        "title": "Industry Partnership Fair",
        "time": "11:00 AM – 4:00 PM",
        "location": "Senate House, UNILAG",
        "type": "Networking",
        "typeColor": "hsl(342 43% 35%)",
        "description": "Meet representatives from our industry partners including Siemens, Texas Instruments, and local tech companies. Internship and job opportunities available.",
        "spots": "Open registration"
      },
      {
        "day": "02",
        "month": "Aug",
        "title": "PCB Design Masterclass",
        "time": "9:00 AM – 1:00 PM",
        "location": "Design Studio, ENG Building",
        "type": "Workshop",
        "typeColor": "hsl(9 55% 32%)",
        "description": "Learn professional PCB layout using KiCad with our electronics design team. From schematic capture to Gerber export and DFM review.",
        "spots": "15 spots remaining"
      },
      {
        "day": "14",
        "month": "Aug",
        "title": "Research Showcase & Demo Day",
        "time": "2:00 PM – 6:00 PM",
        "location": "Great Hall, UNILAG",
        "type": "Showcase",
        "typeColor": "hsl(18 29% 52%)",
        "description": "Student and faculty research groups present their latest projects to the engineering community, industry guests, and UNILAG leadership.",
        "spots": "Open to all"
      },
      {
        "day": "05",
        "month": "Sep",
        "title": "IoT for Smart Cities Seminar",
        "time": "10:00 AM – 12:00 PM",
        "location": "Lecture Theatre B, ENG",
        "type": "Seminar",
        "typeColor": "hsl(41 87% 44%)",
        "description": "Guest lecture by Dr. Adeyemi Okafor (Lagos State Smart City Initiative) on deploying IoT infrastructure at city scale. Q&A session included.",
        "spots": "Open to all"
      }
    ]
  },
  "achievements": {
    "fields": {
      "heading": "Excellence recognised nationally and globally",
      "subheading": ""
    },
    "items": [
      {
        "icon": "Trophy",
        "title": "National Engineering Challenge — 1st Place",
        "year": "2025",
        "description": "Team SmartRoad won first prize at the Nigerian Universities Engineering Challenge with their AI-powered pothole detection system.",
        "category": "Competition"
      },
      {
        "icon": "Award",
        "title": "Best Undergraduate Research Paper — IEEE Nigeria",
        "year": "2025",
        "description": "Fatima Suleiman and team received the IEEE Nigeria Section award for their paper on low-cost ECG signal processing on embedded hardware.",
        "category": "Research"
      },
      {
        "icon": "Star",
        "title": "Google Solution Challenge — Top 100 Globally",
        "year": "2024",
        "description": "AgriSense team placed in the global top 100 of the Google Solution Challenge, competing against 25,000+ teams from 100+ countries.",
        "category": "Competition"
      },
      {
        "icon": "TrendingUp",
        "title": "₦2M NITDA Innovation Grant Awarded",
        "year": "2024",
        "description": "The studio received a ₦2 million grant from NITDA to fund the Smart Campus Air Quality monitoring infrastructure project.",
        "category": "Grant"
      },
      {
        "icon": "Trophy",
        "title": "Pan-African Robotics Competition — Finalist",
        "year": "2024",
        "description": "Two teams from the Design Studio reached the final round of the Pan-African Robotics Competition held in Nairobi, Kenya.",
        "category": "Competition"
      },
      {
        "icon": "Award",
        "title": "200+ Students Certified",
        "year": "2023–2025",
        "description": "The studio has formally certified over 200 students in embedded systems, PCB design, and IoT engineering through its structured training programme.",
        "category": "Milestone"
      }
    ]
  },
  "gallery": {
    "fields": {
      "heading": "Moments from the studio",
      "subheading": ""
    },
    "items": [
      {
        "label": "Hackathon 2025",
        "aspect": "tall",
        "bg": "linear-gradient(135deg, hsl(9 55% 20%), hsl(9 45% 12%))",
        "emoji": "🏆"
      },
      {
        "label": "PCB Lab Session",
        "aspect": "wide",
        "bg": "linear-gradient(135deg, hsl(25 60% 20%), hsl(25 45% 12%))",
        "emoji": "🔧"
      },
      {
        "label": "AgriSense Demo",
        "aspect": "square",
        "bg": "linear-gradient(135deg, hsl(85 35% 18%), hsl(85 25% 10%))",
        "emoji": "🌱"
      },
      {
        "label": "Arduino Workshop",
        "aspect": "square",
        "bg": "linear-gradient(135deg, hsl(342 43% 20%), hsl(342 35% 12%))",
        "emoji": "⚡"
      },
      {
        "label": "Research Showcase",
        "aspect": "wide",
        "bg": "linear-gradient(135deg, hsl(41 70% 20%), hsl(41 50% 12%))",
        "emoji": "🔬"
      },
      {
        "label": "Robotics Demo Day",
        "aspect": "tall",
        "bg": "linear-gradient(135deg, hsl(200 30% 18%), hsl(200 22% 10%))",
        "emoji": "🤖"
      },
      {
        "label": "Industry Fair",
        "aspect": "square",
        "bg": "linear-gradient(135deg, hsl(358 45% 20%), hsl(358 32% 12%))",
        "emoji": "🤝"
      },
      {
        "label": "Student Projects",
        "aspect": "square",
        "bg": "linear-gradient(135deg, hsl(18 35% 18%), hsl(18 25% 10%))",
        "emoji": "💡"
      }
    ]
  },
  "sponsors": {
    "fields": {
      "heading": "Supported by industry leaders",
      "subheading": ""
    },
    "items": [
      {
        "name": "Texas Instruments",
        "category": "Semiconductor",
        "tier": "platinum"
      },
      {
        "name": "Siemens Nigeria",
        "category": "Industrial Tech",
        "tier": "platinum"
      },
      {
        "name": "Google Developer Student Clubs",
        "category": "Technology",
        "tier": "gold"
      },
      {
        "name": "Arduino",
        "category": "Open Hardware",
        "tier": "gold"
      },
      {
        "name": "Raspberry Pi Foundation",
        "category": "Education",
        "tier": "gold"
      },
      {
        "name": "Lagos State Government",
        "category": "Government",
        "tier": "silver"
      },
      {
        "name": "Chevron Nigeria",
        "category": "Energy",
        "tier": "silver"
      },
      {
        "name": "Access Bank",
        "category": "Finance",
        "tier": "silver"
      },
      {
        "name": "NITDA",
        "category": "Government ICT",
        "tier": "silver"
      },
      {
        "name": "Andela Nigeria",
        "category": "Tech Talent",
        "tier": "community"
      },
      {
        "name": "CcHub",
        "category": "Innovation Hub",
        "tier": "community"
      },
      {
        "name": "Data Science Nigeria",
        "category": "AI & Data",
        "tier": "community"
      }
    ]
  },
  "contact": {
    "fields": {
      "heading": "Get in touch",
      "subheading": "",
      "email": "designstudio.eng@unilag.edu.ng",
      "phone": "+234 916 234 3100",
      "address": "Faculty of Engineering, University of Lagos, Akoka, Lagos, Nigeria",
      "hours": "8AM – 4PM, Monday – Friday"
    },
    "items": []
  }
};
