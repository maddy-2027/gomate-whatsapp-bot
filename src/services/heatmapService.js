/**
 * GoMate Taluka Demand Heatmap & Machinery Deficit Service
 * Analyzes booking density across Jath Taluka clusters (125 villages)
 * to detect fleet shortages and recommend machinery reallocations.
 */

const { JATH_VILLAGES } = require('../data/jathVillages');
const { VILLAGE_COORDINATES } = require('./distanceService');

// Core Geographic Clusters in Jath Taluka with seed activity data
const JATH_CLUSTERS = [
  {
    id: 'CL-JAT',
    name: 'Jat Center (जत मुख्य केंद्र)',
    nameMr: 'जत शहर व मध्यवर्ती भाग',
    hubVillage: 'जत',
    lat: 17.0450,
    lng: 75.2250,
    demandCount: 38,
    activeListings: 24,
    topNeededEquipment: 'JCB Backhoe Loader',
    status: 'BALANCED',
    coverageVillages: 18
  },
  {
    id: 'CL-SHEGAON',
    name: 'Shegaon Cluster (शेगाव भाग)',
    nameMr: 'शेगाव व पूर्व जत पट्टा',
    hubVillage: 'शेगाव',
    lat: 17.0850,
    lng: 75.2900,
    demandCount: 29,
    activeListings: 6,
    topNeededEquipment: 'Rotavator & 45HP Tractor',
    status: 'CRITICAL_DEFICIT',
    coverageVillages: 16
  },
  {
    id: 'CL-SANKH',
    name: 'Sankh Cluster (संख भाग)',
    nameMr: 'संख व दक्षिण-पूर्व सीमा भाग',
    hubVillage: 'संख',
    lat: 16.9200,
    lng: 75.4500,
    demandCount: 22,
    activeListings: 5,
    topNeededEquipment: 'Deep Plough & Tractor',
    status: 'CRITICAL_DEFICIT',
    coverageVillages: 21
  },
  {
    id: 'CL-UMADI',
    name: 'Umadi Cluster (उमदी भाग)',
    nameMr: 'उमदी व डाळिंब बागायत पट्टा',
    hubVillage: 'उमदी',
    lat: 16.9800,
    lng: 75.5200,
    demandCount: 19,
    activeListings: 12,
    topNeededEquipment: 'Agri Spraying Drone 10L',
    status: 'BALANCED',
    coverageVillages: 24
  },
  {
    id: 'CL-DAFALAPUR',
    name: 'Dafalapur Cluster (डफळापूर भाग)',
    nameMr: 'डफळापूर व पश्चिम जत पट्टा',
    hubVillage: 'डफळापूर',
    lat: 17.0100,
    lng: 75.1200,
    demandCount: 15,
    activeListings: 14,
    topNeededEquipment: 'Tipping Trolley (4-Tonne)',
    status: 'SURPLUS',
    coverageVillages: 15
  },
  {
    id: 'CL-BILUR',
    name: 'Bilur Cluster (बिळूर भाग)',
    nameMr: 'बिळूर व उत्तर जत पट्टा',
    hubVillage: 'बिळूर',
    lat: 17.1500,
    lng: 75.1800,
    demandCount: 14,
    activeListings: 8,
    topNeededEquipment: 'Rotavator (6-ft)',
    status: 'BALANCED',
    coverageVillages: 17
  },
  {
    id: 'CL-MADGYAL',
    name: 'Madgyal Cluster (माडग्याळ भाग)',
    nameMr: 'माडग्याळ व मेंढुगिरी पट्टा',
    hubVillage: 'माडग्याळ',
    lat: 17.0600,
    lng: 75.3800,
    demandCount: 12,
    activeListings: 4,
    topNeededEquipment: 'Cultivator (9-Tyne)',
    status: 'CRITICAL_DEFICIT',
    coverageVillages: 14
  }
];

/**
 * Get Taluka Heatmap & Fleet Deficit Metrics
 */
async function getTalukaHeatmapMetrics() {
  const totalDemand = JATH_CLUSTERS.reduce((sum, c) => sum + c.demandCount, 0);
  const totalListings = JATH_CLUSTERS.reduce((sum, c) => sum + c.activeListings, 0);
  const deficitClusters = JATH_CLUSTERS.filter(c => c.status === 'CRITICAL_DEFICIT');

  const alerts = deficitClusters.map(c => ({
    clusterId: c.id,
    clusterName: c.nameMr,
    alertMr: `⚠️ **${c.nameMr}** मध्ये **${c.topNeededEquipment}** ची तीव्र कमतरता आहे (${c.demandCount} मागण्या / फक्त ${c.activeListings} ट्रॅक्टर उपलब्ध)!`,
    recommendationMr: `डफळापूर किंवा जत केंद्रातील अतिरिक्त ट्रॅक्टर मालकांना ₹१००/तास बोनस देऊन शेगाव/संख भागात पाठवा.`,
    urgency: 'HIGH'
  }));

  return {
    taluka: 'Jath (जत तालुका, सांगली)',
    totalVillages: 125,
    totalDemand,
    totalListings,
    overallDeficitRatio: Math.round((totalDemand / totalListings) * 10) / 10,
    clusters: JATH_CLUSTERS,
    deficitAlerts: alerts,
    demandDistribution: {
      rotavators: '38%',
      ploughs: '26%',
      jcbExcavation: '18%',
      sprayDrones: '11%',
      trolleys: '7%'
    }
  };
}

module.exports = {
  getTalukaHeatmapMetrics,
  JATH_CLUSTERS
};
