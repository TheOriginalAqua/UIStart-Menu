// Division configuration: role lists and subdivision mappings
window.roleData = {
  police: {
    label: "Select your Division",
    subroles: [
      "Emergency Response Team",
      "Dog Support Unit",
      "Criminal Investigation Department",
      "Roads Transport Policing Command",
      "Authorised Firearms Officer",
    ],
  },
  ambulance: {
    label: "Select your Division",
    subroles: [
      "Paramedic",
      "Hazardous Area Response Team",
      "Helicopter Emergency Medical Service",
    ],
  },
  fire: {
    label: "Select your Division",
    subroles: ["London Fire Fighter", "Fire Rescue Unit"],
  },
  auxiliary: {
    label: "Select your Division",
    subroles: ["Control Room", "National Highways Team"],
  }
};

window.subdivisionData = {
  police: {
    "Emergency Response Team": ["Beat Response", "Rapid Response Unit", "Tactical Support", "Custody Escort"],
    "Dog Support Unit": ["General Purpose Dogs", "Firearms Support Dogs", "Search & Detection"],
    "Criminal Investigation Department": ["Major Investigation Team", "Fraud Unit", "Cyber Crime Unit"],
    "Roads Transport Policing Command": ["Traffic Patrol", "Collision Investigation", "ANPR Interceptor"],
    "Authorised Firearms Officer": ["Armed Response Vehicle", "Firearms Support", "Close Protection"],
  },
  ambulance: {
    "Paramedic": ["Frontline Paramedic", "Rapid Response Car", "Community First Responder"],
    "Hazardous Area Response Team": ["HART Operative", "Water Rescue", "Marauding Attack Response"],
    "Helicopter Emergency Medical Service": ["Flight Paramedic", "Critical Care Doctor", "Winchman"],
  },
  fire: {
    "London Fire Fighter": ["Pump Crew", "Breathing Apparatus", "Community Safety"],
    "Fire Rescue Unit": ["Urban Search & Rescue", "Technical Rescue", "Water Rescue Unit"],
  },
  auxiliary: {
    "Control Room": ["Dispatcher", "Call Handler"],
    "National Highways Team": ["Traffic Officer", "Incident Support Unit"],
  },
};
