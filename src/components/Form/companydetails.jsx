// src/components/Form/companydetails.jsx (Updated with "Company Licence" field after Owner Name, increased width, tabs in single line)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBuilding, FaPlus, FaClock, FaGlobe, FaLink, FaTrash, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaCopy } from 'react-icons/fa';

// FULL COUNTRY DATA & ADDRESS HIERARCHY
const countryAddressHierarchy = {
  "Afghanistan": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Albania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Algeria": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Andorra": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Angola": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Antigua and Barbuda": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Argentina": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Municipality", values: [] } },
  "Armenia": { field1: { label: "Province", values: [] }, field2: { label: "Community", values: [] }, field3: { label: "Area", values: [] } },
  "Australia": { field1: { label: "State/Territory", values: [] }, field2: { label: "Local Government Area", values: [] }, field3: { label: "Suburb", values: [] } },
  "Austria": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Azerbaijan": { field1: { label: "Economic Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Bahamas": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Bahrain": { field1: { label: "Governorate", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Bangladesh": { field1: { label: "Division", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Upazila", values: [] } },
  "Barbados": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Belarus": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Belgium": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Belize": { field1: { label: "District", values: [] }, field2: { label: "Town", values: [] }, field3: { label: "Area", values: [] } },
  "Benin": { field1: { label: "Department", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Bhutan": { field1: { label: "District", values: [] }, field2: { label: "Gewog", values: [] }, field3: { label: "Village", values: [] } },
  "Bolivia": { field1: { label: "Department", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Bosnia and Herzegovina": { field1: { label: "Entity", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "Municipality", values: [] } },
  "Botswana": { field1: { label: "District", values: [] }, field2: { label: "Sub-District", values: [] }, field3: { label: "Area", values: [] } },
  "Brazil": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Neighborhood", values: [] } },
  "Brunei": { field1: { label: "District", values: [] }, field2: { label: "Mukim", values: [] }, field3: { label: "Village", values: [] } },
  "Bulgaria": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Burkina Faso": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "Burundi": { field1: { label: "Province", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Cambodia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Cameroon": { field1: { label: "Region", values: [] }, field2: { label: "Division", values: [] }, field3: { label: "Sub-Division", values: [] } },
  "Canada": { field1: { label: "Province/Territory", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cape Verde": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Central African Republic": { field1: { label: "Prefecture", values: [] }, field2: { label: "Sub-Prefecture", values: [] }, field3: { label: "Area", values: [] } },
  "Chad": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Chile": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "China": { field1: { label: "Province", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "County", values: [] } },
  "Colombia": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Comoros": { field1: { label: "Island", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Area", values: [] } },
  "Costa Rica": { field1: { label: "Province", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "District", values: [] } },
  "Croatia": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cuba": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cyprus": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Czech Republic": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Denmark": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Djibouti": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Dominica": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Dominican Republic": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Ecuador": { field1: { label: "Province", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "Parish", values: [] } },
  "Egypt": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "El Salvador": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Equatorial Guinea": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Eritrea": { field1: { label: "Region", values: [] }, field2: { label: "Sub-Region", values: [] }, field3: { label: "Area", values: [] } },
  "Estonia": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Eswatini": { field1: { label: "Region", values: [] }, field2: { label: "Inkhundla", values: [] }, field3: { label: "Area", values: [] } },
  "Ethiopia": { field1: { label: "Region", values: [] }, field2: { label: "Zone", values: [] }, field3: { label: "Woreda", values: [] } },
  "Fiji": { field1: { label: "Division", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "District", values: [] } },
  "Finland": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "France": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Commune", values: [] } },
  "Gabon": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Gambia": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Georgia": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Germany": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Ghana": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Greece": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Grenada": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Guatemala": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Guinea": { field1: { label: "Region", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Sub-Prefecture", values: [] } },
  "Guinea-Bissau": { field1: { label: "Region", values: [] }, field2: { label: "Sector", values: [] }, field3: { label: "Area", values: [] } },
  "Guyana": { field1: { label: "Region", values: [] }, field2: { label: "Neighborhood Council", values: [] }, field3: { label: "Area", values: [] } },
  "Haiti": { field1: { label: "Department", values: [] }, field2: { label: "Arrondissement", values: [] }, field3: { label: "Commune", values: [] } },
  "Honduras": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Hungary": { field1: { label: "County", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Iceland": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "India": { field1: { label: "State/UT", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Taluk", values: [] } },
  "Indonesia": { field1: { label: "Province", values: [] }, field2: { label: "Regency/City", values: [] }, field3: { label: "District", values: [] } },
  "Iran": { field1: { label: "Province", values: [] }, field2: { label: "County", values: [] }, field3: { label: "District", values: [] } },
  "Iraq": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Ireland": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Israel": { field1: { label: "District", values: [] }, field2: { label: "Sub-District", values: [] }, field3: { label: "Area", values: [] } },
  "Italy": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Jamaica": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Japan": { field1: { label: "Prefecture", values: [] }, field2: { label: "City/Ward", values: [] }, field3: { label: "District", values: [] } },
  "Jordan": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Kazakhstan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Kenya": { field1: { label: "County", values: [] }, field2: { label: "Sub-County", values: [] }, field3: { label: "Ward", values: [] } },
  "Kiribati": { field1: { label: "Island", values: [] }, field2: { label: "Council", values: [] }, field3: { label: "Area", values: [] } },
  "Kuwait": { field1: { label: "Governorate", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "Block", values: [] } },
  "Kyrgyzstan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Laos": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Village", values: [] } },
  "Latvia": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Lebanon": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Lesotho": { field1: { label: "District", values: [] }, field2: { label: "Community Council", values: [] }, field3: { label: "Area", values: [] } },
  "Liberia": { field1: { label: "County", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Libya": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Liechtenstein": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Lithuania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Luxembourg": { field1: { label: "Canton", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Madagascar": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Malawi": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Malaysia": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Mukim", values: [] } },
  "Maldives": { field1: { label: "Atoll", values: [] }, field2: { label: "Island", values: [] }, field3: { label: "Area", values: [] } },
  "Mali": { field1: { label: "Region", values: [] }, field2: { label: "Cercle", values: [] }, field3: { label: "Commune", values: [] } },
  "Malta": { field1: { label: "Region", values: [] }, field2: { label: "Local Council", values: [] }, field3: { label: "Area", values: [] } },
  "Marshall Islands": { field1: { label: "Atoll", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Mauritania": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Mauritius": { field1: { label: "District", values: [] }, field2: { label: "Village", values: [] }, field3: { label: "Area", values: [] } },
  "Mexico": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Locality", values: [] } },
  "Micronesia": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Moldova": { field1: { label: "District", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Monaco": { field1: { label: "Commune", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Mongolia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Bag", values: [] } },
  "Montenegro": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Morocco": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "Mozambique": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Myanmar": { field1: { label: "Region/State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Township", values: [] } },
  "Namibia": { field1: { label: "Region", values: [] }, field2: { label: "Constituency", values: [] }, field3: { label: "Area", values: [] } },
  "Nauru": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Nepal": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Netherlands": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "New Zealand": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Nicaragua": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Niger": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Commune", values: [] } },
  "Nigeria": { field1: { label: "State", values: [] }, field2: { label: "Local Government Area", values: [] }, field3: { label: "Ward", values: [] } },
  "North Korea": { field1: { label: "Province", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Area", values: [] } },
  "North Macedonia": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Norway": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Oman": { field1: { label: "Governorate", values: [] }, field2: { label: "Wilayat", values: [] }, field3: { label: "Area", values: [] } },
  "Pakistan": { field1: { label: "Province", values: [] }, field2: { label: "Division", values: [] }, field3: { label: "District", values: [] } },
  "Palau": { field1: { label: "State", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Panama": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Corregimiento", values: [] } },
  "Papua New Guinea": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Paraguay": { field1: { label: "Department", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Peru": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "District", values: [] } },
  "Philippines": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "City/Municipality", values: [] } },
  "Poland": { field1: { label: "Voivodeship", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Gmina", values: [] } },
  "Portugal": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Parish", values: [] } },
  "Qatar": { field1: { label: "Municipality", values: [] }, field2: { label: "Zone", values: [] }, field3: { label: "Area", values: [] } },
  "Romania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Russia": { field1: { label: "Federal Subject", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Rwanda": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sector", values: [] } },
  "Saint Lucia": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Samoa": { field1: { label: "District", values: [] }, field2: { label: "Village", values: [] }, field3: { label: "Area", values: [] } },
  "San Marino": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Saudi Arabia": { field1: { label: "Province", values: [] }, field2: { label: "Governorate", values: [] }, field3: { label: "Area", values: [] } },
  "Senegal": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Arrondissement", values: [] } },
  "Serbia": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Seychelles": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Sierra Leone": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Singapore": { field1: { label: "City-State", values: [] }, field2: { label: "N/A", values: [] }, field3: { label: "N/A", values: [] } },
  "Slovakia": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Slovenia": { field1: { label: "Statistical Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Solomon Islands": { field1: { label: "Province", values: [] }, field2: { label: "Ward", values: [] }, field3: { label: "Area", values: [] } },
  "Somalia": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "South Africa": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "South Korea": { field1: { label: "Province", values: [] }, field2: { label: "City/County", values: [] }, field3: { label: "District", values: [] } },
  "South Sudan": { field1: { label: "State", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Payam", values: [] } },
  "Spain": { field1: { label: "Autonomous Community", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Sri Lanka": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Division", values: [] } },
  "Sudan": { field1: { label: "State", values: [] }, field2: { label: "Locality", values: [] }, field3: { label: "Area", values: [] } },
  "Suriname": { field1: { label: "District", values: [] }, field2: { label: "Resort", values: [] }, field3: { label: "Area", values: [] } },
  "Sweden": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Switzerland": { field1: { label: "Canton", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Syria": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Taiwan": { field1: { label: "County/City", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tajikistan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tanzania": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Ward", values: [] } },
  "Thailand": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sub-District", values: [] } },
  "Togo": { field1: { label: "Region", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Canton", values: [] } },
  "Tonga": { field1: { label: "Division", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Trinidad and Tobago": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Tunisia": { field1: { label: "Governorate", values: [] }, field2: { label: "Delegation", values: [] }, field3: { label: "Sector", values: [] } },
  "Turkey": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Neighborhood", values: [] } },
  "Turkmenistan": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tuvalu": { field1: { label: "Island", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Uganda": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sub-County", values: [] } },
  "Ukraine": { field1: { label: "Oblast", values: [] }, field2: { label: "Raion", values: [] }, field3: { label: "Hromada", values: [] } },
  "United Arab Emirates": { field1: { label: "Emirate", values: [] }, field2: { label: "City", values: [] }, field3: { label: "Area", values: [] } },
  "United Kingdom": { field1: { label: "Country", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Borough", values: [] } },
  "United States": { field1: { label: "State", values: [] }, field2: { label: "County", values: [] }, field3: { label: "City", values: [] } },
  "Uruguay": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Uzbekistan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Vanuatu": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Vatican City": { field1: { label: "None", values: [] }, field2: { label: "N/A", values: [] }, field3: { label: "N/A", values: [] } },
  "Venezuela": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Parish", values: [] } },
  "Vietnam": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Yemen": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Zambia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Zimbabwe": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } }
};

// Helper: Get labels for fields based on country
const getAddressLabels = (country, addressStructure) => {
  // Use local hierarchy if structure is empty or country missing
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: countryAddressHierarchy };

  if (!country || !structure.countries[country]) {
    return ["Region", "City", "Area", "Building"];
  }
  const countryData = structure.countries[country];
  return [
    countryData.field1?.label || "Region",
    countryData.field2?.label || "City",
    countryData.field3?.label || "Area",
    countryData.field4?.label || "Building"
  ];
};

// Helper: Get options (dropdown values) for a field
const getOptionsForField = (field, country, addressStructure, linkedValues, parentValue = null) => {
  // Use local hierarchy if structure is empty or country missing
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: countryAddressHierarchy };

  if (!country || !structure) return [];

  const { countries } = structure;

  // Level 1: Dependent only on Country
  if (field === 'field1') {
    return countries?.[country]?.field1?.values || [];
  }

  // Level 2: Dependent on Field 1 (parentValue)
  if (field === 'field2') {
    if (!parentValue) {
      // Fallback: if no parent linked, show all generic values from hierarchy if available
      return countries?.[country]?.field2?.values || [];
    }
    const linked = linkedValues?.[country]?.[parentValue]?.field2;
    if (linked && Array.isArray(linked)) return linked;
    // Fallback if no specific link found
    return countries?.[country]?.field2?.values || [];
  }

  // Level 3: Dependent on Field 2 (parentValue)
  if (field === 'field3') {
    if (!parentValue) {
      return countries?.[country]?.field3?.values || [];
    }
    const linked = linkedValues?.[country]?.[parentValue]?.field3;
    if (linked && Array.isArray(linked)) return linked;
    return countries?.[country]?.field3?.values || [];
  }

  return [];
};

// NEW: Country Rules for Validation
const countryRules = [
  { code: "+91", country: "India", length: 10 },
  { code: "+971", country: "UAE", length: 9 },
  { code: "+1", country: "USA", length: 10 },
  { code: "+44", country: "UK", length: 10 },
  { code: "+61", country: "Australia", length: 9 },
];

// Helper to ensure 24-hour HH:mm format
const formatTo24Hour = (timeStr) => {
  if (!timeStr) return '';
  // Check if it matches HH:mm format (24-hour)
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) {
    return timeStr;
  }
  // Convert 12-hour format to 24-hour
  const [time, modifier] = timeStr.split(' ');
  if (!time || !modifier) return timeStr;
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
};
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) setShowList(true);
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) onChange(option);
    setShowList(false);
  };

  const handleCreateNewOption = async () => {
    if (onCreateRequest) {
      onCreateRequest(search);
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      if (!search.trim()) {
        setShowList(false);
        return;
      }
      const success = await onAddNewValue(search);
      if (success) {
        setSearch(search);
        if (onChange) onChange(search);
        setShowList(false);
      }
    }
  };

  const handleFocus = () => setShowList(true);
  const handleBlur = () => setTimeout(() => setShowList(false), 200);

  return (
    <div className="searchable-select">
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {showList && (
        <ul className="searchable-list">
          {allowCreateNew && (onAddNewValue || onCreateRequest) && (
            (() => {
              const isExactMatch = filteredOptions.some(option => option.toLowerCase() === search.toLowerCase());
              const hasSearch = !!search.trim();
              if ((onCreateRequest && !isExactMatch) || (onAddNewValue && hasSearch && !isExactMatch)) {
                let createText;
                if (hasSearch) {
                  createText = createNewLabel ? `Create New ${createNewLabel}: "${search.trim()}"` : `Create New: "${search.trim()}"`;
                } else {
                  createText = createNewLabel ? `Create New ${createNewLabel}` : `Create New`;
                }
                return (
                  <li
                    key="create-new"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateNewOption();
                    }}
                    style={{ fontStyle: 'italic', color: '#007bff' }}
                  >
                    {createText}
                  </li>
                );
              }
              return null;
            })()
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(option);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            !allowCreateNew && <li className="no-options">No matching options</li>
          )}
        </ul>
      )}
    </div>
  );
};
// NEW: Country Code Selector Component (similar to AddEmployee)
const CountryCodeSelector = ({ selectedCode = '+91', onCodeChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const handleCodeSelect = (code) => {
    onCodeChange(code);
    setShowDropdown(false);
  };
  return (
    <div className="country-code-selector" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: '#fff',
          border: '1px solid #bdc3c7',
          borderRight: 'none',
          padding: '10px 8px',
          fontSize: '1rem',
          height: '100%',
          cursor: 'pointer',
          borderRadius: '8px 0 0 8px',
        }}
      >
        {selectedCode}
      </button>
      {showDropdown && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 100,
          background: '#fff',
          border: '1px solid #bdc3c7',
          borderRadius: '0 0 8px 8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          minWidth: '120px',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
        }}>
          {countryRules.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleCodeSelect(c.code)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {c.code} ({c.country})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
function CompanyDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    companyLicence: '', // NEW: Company Licence field
    businessType: '',
    otherBusinessType: '',
    taxType: '',
    taxPercentage: '',
    taxNumber: '',
    fssaiNumber: '',
    panNumber: '',
    openingTime: '',
    closingTime: '',
    totalTime: '',
    specialTimings: [], // NEW: Array for special timings {reason, date, startTime, endTime, duration}
    addresses: [{ country: '', field1: '', field2: '', field3: '', flat_villa_no: '', building_name: '' }],
    contacts: [{
      phoneCountryCode: '+91',
      phoneNumber: '',
      whatsappCountryCode: '+91',
      whatsappNumber: '',
      emailAddress: '',
      websites: [] // NEW: Array for multiple websites
    }],
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    currencyType: '', // Will be pre-filled from settings
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState(''); // NEW: For warning messages
  const [activeSection, setActiveSection] = useState('basic'); // Default to 'basic' to show form first
  const [savedDetails, setSavedDetails] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null); // State for logo URL
  // Initialize with local hierarchy as default
  const [addressStructure, setAddressStructure] = useState({
    countries: countryAddressHierarchy
  });
  const [linkedValues, setLinkedValues] = useState({});
  const [baseUrl, setBaseUrl] = useState(""); // NEW: Added baseUrl state like in AdminPage
  const [systemSettings, setSystemSettings] = useState({}); // NEW: State for system settings (for currency)
  // NEW: States for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // OLD: Remove editingSpecialIndex and tempSpecialTiming for add only
  const [tempSpecialTiming, setTempSpecialTiming] = useState({ reason: '', date: '', startTime: '', endTime: '', duration: '' });

  // Dynamic Address State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalOnSave, setModalOnSave] = useState(null);
  const [modalOnChange, setModalOnChange] = useState(null);

  const countryList = Object.keys(countryAddressHierarchy);

  // NEW: Fetch config to determine baseUrl
  const fetchConfig = async () => {
    let currentBaseUrl = "";
    try {
      const response = await axios.get("http://localhost:8000/api/network_info");
      const { config: appConfig } = response.data;
      if (appConfig.mode === "client") {
        currentBaseUrl = `http://${appConfig.server_ip}:8000`;
        setBaseUrl(currentBaseUrl);
      } else {
        setBaseUrl("");
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
      setBaseUrl("");
    } finally {
      // Pass the determined baseUrl to fetch functions
      if (currentBaseUrl) {
        fetchLogo(currentBaseUrl);
        fetchAddressStructure(currentBaseUrl);
        fetchCompanyDetails(currentBaseUrl);
        fetchSystemSettings(currentBaseUrl); // NEW: Fetch settings for currency
      } else {
        // If not client mode, use empty baseUrl (local)
        fetchLogo("");
        fetchAddressStructure("");
        fetchCompanyDetails("");
        fetchSystemSettings(""); // NEW
      }
    }
  };
  // NEW: Fetch system settings for pre-filling currency
  const fetchSystemSettings = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/settings`);
      if (response.data) {
        setSystemSettings(response.data);
        // Pre-fill currencyType if not already set
        if (!formData.currencyType) {
          setFormData(prev => ({ ...prev, currencyType: response.data.currency || 'INR' }));
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };
  // UPDATED: Fetch logo with baseUrl
  const fetchLogo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/logo`);
      if (response.data.logo) {
        // Prepend the baseUrl if it's not already included
        const logoPath = response.data.logo.startsWith('http') ? response.data.logo : currentBaseUrl + response.data.logo;
        setLogoUrl(logoPath);
      }
    } catch (err) {
      console.error("Failed to fetch logo:", err);
      // Don't set a main error, just log it
    }
  };
  // UPDATED: Fetch address structure with baseUrl
  const fetchAddressStructure = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/address-structures`);
      if (response.data) {
        // Merge API data with local hierarchy to ensure integrity
        const apiStructure = response.data.structure || {};
        const mergedCountries = { ...countryAddressHierarchy, ...apiStructure.countries };

        setAddressStructure({ countries: mergedCountries });
        setLinkedValues(response.data.linkedValues || {});
      }
    } catch (error) {
      console.error('Error fetching address structure:', error);
      // Fallback is already set in initial state
    }
  };
  // UPDATED: Fetch company details with baseUrl
  const fetchCompanyDetails = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latestDetails = response.data.companyDetails[response.data.companyDetails.length - 1];
        setSavedDetails(latestDetails);
        setFormData(latestDetails); // Pre-fill form with the latest data
        // NEW: Ensure currencyType is set from settings if not in details
        if (!latestDetails.currencyType && systemSettings.currency) {
          setFormData(prev => ({ ...prev, currencyType: systemSettings.currency }));
        }
        console.log('Fetched details:', latestDetails); // Debug log
      } else {
        // setError('No company details found.'); // Don't show error, just means new entry
        console.log('No existing company details found. Ready for new entry.');
        // NEW: Pre-fill currency from settings for new entry
        if (systemSettings.currency) {
          setFormData(prev => ({ ...prev, currencyType: systemSettings.currency }));
        }
      }
    } catch (err) {
      setError('Failed to fetch company details: ' + err.message);
      console.error('Fetch error:', err);
    }
  };
  useEffect(() => {
    fetchConfig(); // UPDATED: Call fetchConfig instead of individual fetches
  }, []);

  // NEW: Always Sync currency from system settings since it is read-only and should match system
  useEffect(() => {
    if (systemSettings.currency && formData.currencyType !== systemSettings.currency) {
      setFormData(prev => ({ ...prev, currencyType: systemSettings.currency }));
    }
  }, [systemSettings.currency, formData.currencyType]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleOpeningTimeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, openingTime: value }));
    calculateTotalTime(value, formData.closingTime);
  };
  const handleClosingTimeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, closingTime: value }));
    calculateTotalTime(formData.openingTime, value);
  };
  const calculateTotalTime = (opening, closing) => {
    if (!opening || !closing) {
      setFormData((prev) => ({ ...prev, totalTime: '' }));
      return;
    }
    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);
    let totalMin = (closeH * 60 + closeM) - (openH * 60 + openM);
    if (totalMin < 0) totalMin += 24 * 60;
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    const total = `${totalH.toString().padStart(2, '0')}:${totalM.toString().padStart(2, '0')}`;
    setFormData((prev) => ({ ...prev, totalTime: total }));
  };
  // NEW: Calculate duration for special timing
  const calculateSpecialDuration = (startTime, endTime, setDuration) => {
    if (!startTime || !endTime) {
      setDuration('');
      return;
    }
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let totalMin = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMin < 0) totalMin += 24 * 60;
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    const total = `${totalH.toString().padStart(2, '0')}:${totalM.toString().padStart(2, '0')}`;
    setDuration(total);
  };
  // NEW: Handle special timing changes for add
  const handleSpecialChange = (field, value) => {
    setTempSpecialTiming(prev => ({ ...prev, [field]: value }));
    if (field === 'startTime' || field === 'endTime') {
      calculateSpecialDuration(
        field === 'startTime' ? value : tempSpecialTiming.startTime,
        field === 'endTime' ? value : tempSpecialTiming.endTime,
        (duration) => setTempSpecialTiming(prev => ({ ...prev, duration }))
      );
    }
  };
  // UPDATED: Add special timing (only add, no edit here)
  const saveSpecialTiming = () => {
    if (!tempSpecialTiming.reason || !tempSpecialTiming.date || !tempSpecialTiming.startTime || !tempSpecialTiming.endTime) {
      setError('Please fill all fields for special timing.');
      return;
    }
    // Add new
    setFormData(prev => ({
      ...prev,
      specialTimings: [...prev.specialTimings, { ...tempSpecialTiming }]
    }));
    setTempSpecialTiming({ reason: '', date: '', startTime: '', endTime: '', duration: '' });
    setMessage('Special timing saved.');
    setError(null);
  };
  // NEW: Edit special timing - open modal
  const editSpecialTiming = (index) => {
    const special = formData.specialTimings[index];
    setEditingSpecial({ ...special, index });
    setShowEditModal(true);
  };
  // UPDATED: Delete special timing - no confirm, just warning message
  const deleteSpecialTiming = (index) => {
    const updatedSpecials = formData.specialTimings.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, specialTimings: updatedSpecials }));
    setWarning('Special timing deleted.');
    setError(null);
    setMessage('');
  };
  // NEW: Handle edit changes in modal
  const handleEditChange = (field, value) => {
    const newSpecial = { ...editingSpecial, [field]: value };
    setEditingSpecial(newSpecial);
    if (field === 'startTime' || field === 'endTime') {
      const startTime = field === 'startTime' ? value : editingSpecial.startTime;
      const endTime = field === 'endTime' ? value : editingSpecial.endTime;
      calculateSpecialDuration(startTime, endTime, (duration) => {
        setEditingSpecial(prev => ({ ...prev, duration }));
      });
    }
  };
  // NEW: Update special timing from modal
  const updateSpecialTiming = () => {
    if (!editingSpecial.reason || !editingSpecial.date || !editingSpecial.startTime || !editingSpecial.endTime) {
      setError('Please fill all fields for special timing.');
      return;
    }
    const updatedSpecials = [...formData.specialTimings];
    updatedSpecials[editingSpecial.index] = { ...editingSpecial };
    setFormData(prev => ({ ...prev, specialTimings: updatedSpecials }));
    setShowEditModal(false);
    setEditingSpecial(null);
    setShowDeleteConfirm(false);
    setMessage('Special timing updated.');
    setError(null);
  };
  // NEW: Cancel edit in modal
  const cancelEditSpecial = () => {
    setShowEditModal(false);
    setEditingSpecial(null);
    setShowDeleteConfirm(false);
  };
  // NEW: Confirm delete from modal
  const confirmDeleteFromModal = () => {
    deleteSpecialTiming(editingSpecial.index);
    setShowDeleteConfirm(false);
    setShowEditModal(false);
    setEditingSpecial(null);
  };
  const handleAddressChange = (index, e) => {
    const { name, value } = e.target;
    const newAddresses = [...formData.addresses];
    newAddresses[index][name] = value;
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };
  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const newContacts = [...formData.contacts];
    if (name.startsWith('phoneCountryCode') || name.startsWith('whatsappCountryCode')) {
      newContacts[index][name] = value;
    } else {
      newContacts[index][name] = value;
    }
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Handle country code change for phone/whatsapp
  const handleContactCountryCodeChange = (index, field, code) => {
    const newContacts = [...formData.contacts];
    newContacts[index][`${field}CountryCode`] = code;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Handle multiple websites: add/remove
  const addWebsite = (contactIndex) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites.push('');
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  const removeWebsite = (contactIndex, websiteIndex) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites.splice(websiteIndex, 1);
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  const handleWebsiteChange = (contactIndex, websiteIndex, value) => {
    const newContacts = [...formData.contacts];
    newContacts[contactIndex].websites[websiteIndex] = value;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };
  // NEW: Remove entire contact (keep at least one)
  const removeContact = (index) => {
    if (formData.contacts.length > 1) {
      const newContacts = [...formData.contacts];
      newContacts.splice(index, 1);
      setFormData((prev) => ({ ...prev, contacts: newContacts }));
    }
  };
  // NEW: Remove entire address (keep at least one)
  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const newAddresses = [...formData.addresses];
      newAddresses.splice(index, 1);
      setFormData((prev) => ({ ...prev, addresses: newAddresses }));
    }
  };

  // NEW: Copy phone to whatsapp
  const copyPhoneToWhatsapp = (index) => {
    const newContacts = [...formData.contacts];
    newContacts[index].whatsappCountryCode = newContacts[index].phoneCountryCode;
    newContacts[index].whatsappNumber = newContacts[index].phoneNumber;
    setFormData((prev) => ({ ...prev, contacts: newContacts }));
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, { country: '', field1: '', field2: '', field3: '', flat_villa_no: '', building_name: '' }],
    }));
  };
  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, {
        phoneCountryCode: '+91',
        phoneNumber: '',
        whatsappCountryCode: '+91',
        whatsappNumber: '',
        emailAddress: '',
        websites: []
      }],
    }));
  };
  // Helper to get filtered values for field2 and field3 based on field1
  const getFilteredValues = (addressIndex, field) => {
    const address = formData.addresses[addressIndex];
    if (!address.country || !address.field1) return [];
    const links = linkedValues[address.country]?.[address.field1];
    return links?.[field] || [];
  };
  const handleAddressFieldChange = (index, field, value) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index][field] = value;
    // If changing country or field1, clear dependent fields (field2, field3)
    if (field === 'country') { // Reset logic should cascade
      newAddresses[index].field1 = '';
      newAddresses[index].field2 = '';
      newAddresses[index].field3 = '';
    } else if (field === 'field1') {
      newAddresses[index].field2 = '';
      newAddresses[index].field3 = '';
    } else if (field === 'field2') {
      newAddresses[index].field3 = '';
    }
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };

  /* Address Logic */
  const handleAddNewAddressValue = async (field, newValue, associatedCountry, parentValue) => {
    if (!associatedCountry) return false;

    // Determine parent value for API if needed
    let apiParentValue = '';
    if (field === 'field2') apiParentValue = parentValue; // Needs Field1 Value
    if (field === 'field3') apiParentValue = parentValue; // Needs Field2 Value

    try {
      const res = await axios.post(`${baseUrl}/api/add-address-value`, {
        country: associatedCountry,
        field,
        value: newValue,
        parent_value: apiParentValue || undefined
      });

      if (res.status === 200) {
        // Refresh structure
        await fetchAddressStructure(baseUrl);
        return true;
      }
    } catch (e) {
      console.error(e);
      setWarning(`Failed to add new ${field} value`);
      return false;
    }
    return false;
  };

  const handleOpenAddModal = (field, initialSearch, country, parentValue, addressIndex) => {
    setModalField(field);
    setModalValue(initialSearch);

    // Setup save handler
    setModalOnSave(() => async (newValue) => {
      return await handleAddNewAddressValue(field, newValue, country, parentValue);
    });

    // Setup change handler (to update the input after save)
    setModalOnChange(() => (value) => {
      handleAddressFieldChange(addressIndex, field, value);
    });

    setShowAddModal(true);
  };

  const handleSaveModal = async () => {
    const values = modalValue.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) { setShowAddModal(false); return; }

    if (modalOnSave) {
      let allSuccess = true;
      let firstValue = null;
      for (const val of values) {
        const success = await modalOnSave(val);
        if (!success) allSuccess = false;
        if (!firstValue) firstValue = val;
      }
      if (allSuccess && modalOnChange && firstValue) {
        modalOnChange(firstValue);
      }
    }
    setShowAddModal(false);
  };
  // UPDATED: Handle submit with baseUrl and specialTimings
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      setWarning('');

      // VALIDATION: Check phone numbers
      for (let i = 0; i < formData.contacts.length; i++) {
        const contact = formData.contacts[i];

        // Validate Phone Number
        if (contact.phoneNumber) {
          const rule = countryRules.find(r => r.code === contact.phoneCountryCode);
          if (rule && contact.phoneNumber.length !== rule.length) {
            throw new Error(`Contact ${i + 1}: Phone number for ${rule.country} (${contact.phoneCountryCode}) must be ${rule.length} digits.`);
          }
        }

        // Validate WhatsApp Number
        if (contact.whatsappNumber) {
          const rule = countryRules.find(r => r.code === contact.whatsappCountryCode);
          if (rule && contact.whatsappNumber.length !== rule.length) {
            throw new Error(`Contact ${i + 1}: WhatsApp number for ${rule.country} (${contact.whatsappCountryCode}) must be ${rule.length} digits.`);
          }
        }
      }

      console.log('Submitting form data:', formData); // Debug log
      const response = await axios.post(`${baseUrl}/api/company-details`, formData);
      setMessage('Company details saved successfully!');
      setSavedDetails(response.data.companyDetails); // Update with the saved data
      console.log('Saved details:', response.data.companyDetails); // Debug log
      // Refresh the displayed details with baseUrl
      fetchCompanyDetails(baseUrl);
      setActiveSection('details'); // Switch to details view after saving
    } catch (err) {
      setError('Failed to save company details: ' + err.message);
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };
  const getTaxLabel = () => {
    return formData.taxType === 'GST' ? 'GST Number' : 'VAT Number';
  };
  // Format address for print/display: flat_villa_no, building_name, field3, field2, field1, country
  const formatAddressForPrint = (address) => {
    const parts = [];
    if (address.flat_villa_no) parts.push(address.flat_villa_no);
    if (address.building_name) parts.push(address.building_name);
    if (address.field3) parts.push(address.field3);
    if (address.field2) parts.push(address.field2);
    if (address.field1) parts.push(address.field1);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };
  // UPDATED: Format contact for print (include country codes and multiple websites)
  const formatContactForPrint = (contact, index) => {
    return (
      <div key={index}>
        <div className="field"><span className="centered-label">Contact {index + 1}:</span><span className="value"></span></div>
        <div className="field"><span className="label">Phone Number:</span><span className="value">{contact.phoneCountryCode}{contact.phoneNumber || 'N/A'}</span></div>
        <div className="field"><span className="label">WhatsApp Number:</span><span className="value">{contact.whatsappCountryCode}{contact.whatsappNumber || 'N/A'}</span></div>
        <div className="field"><span className="label">Email Address:</span><span className="value">{contact.emailAddress || 'N/A'}</span></div>
        {contact.websites && contact.websites.length > 0 && (
          <div className="field"><span className="label">Websites:</span><span className="value">{contact.websites.filter(w => w).join(', ') || 'N/A'}</span></div>
        )}
      </div>
    );
  };
  // NEW: Format special timing for print/display
  const formatSpecialTimingForPrint = (special, index) => {
    return (
      <div key={index} className="field" style={{ marginBottom: '5px' }}>
        <span className="label">Special {index + 1} - {special.reason} ({special.date}):</span>
        <span className="value">{special.startTime} to {special.endTime} ({special.duration})</span>
      </div>
    );
  };
  // UPDATED: Handle print with dynamic logoUrl, updated contact format, specialTimings, and NEW companyLicence
  const handlePrint = () => {
    if (!savedDetails) {
      setError('No saved details available to print.');
      return;
    }
    console.log('Printing details:', savedDetails); // Debug log
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Company Details Application</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .a4-sheet {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 10mm auto;
              background: #fff;
              box-shadow: 0 0 5px rgba(0,0,0,0.1);
              box-sizing: border-box;
            }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .header img { width: 100px; height: 100px; object-fit: contain; border-radius: 10px; }
            .header h1 { color: #2c3e50; font-size: 24px; margin: 0; text-align: right; font-weight: 600; }
            hr.divider { border: 0; border-top: 2px solid #3498db; margin: 20px 0; }
            h3 { text-align: center; color: #2c3e50; margin-top: 20px; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; }
            .column { width: 48%; min-width: 300px; }
            .field { display: flex; align-items: baseline; margin-bottom: 8px; font-size: 14px; }
            .label { font-weight: bold; min-width: 180px; text-align: right; padding-right: 10px; color: #555; }
            .centered-label { font-weight: bold; min-width: 180px; text-align: center; color: #555; }
            .value { flex: 1; text-align: left; color: #000; }
            .footer { text-align: center; font-weight: bold; color: #2c3e50; margin-top: 30px; font-size: 12px; }
            @media print {
              body { margin: 0; background-color: #fff; }
              .a4-sheet { margin: 0; box-shadow: none; border: none; width: 100%; min-height: 0; padding: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            <!-- MODIFIED: Header with Logo (left) and Title (right) -->
            <div class="header">
              ${logoUrl ? `
                <div>
                  <img src="${logoUrl}" alt="Company Logo" />
                </div>
              ` : '<div></div>'}
              <h1>Company Details<br/>Application</h1>
            </div>
            <!-- MODIFIED: Border Line -->
            <hr class="divider" />
            <div class="section">
              <h3>Basic Information</h3>
              <div class="row">
                <div class="column">
                  <div class="field"><span class="label">Restaurant Name:</span><span class="value">${savedDetails.restaurantName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Business Type:</span><span class="value">${savedDetails.businessType || 'N/A'}${savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span></div>
                  <div class="field"><span class="label">Tax Type:</span><span class="value">${savedDetails.taxType || 'N/A'}</span></div>
                  <div class="field"><span class="label">Tax Percentage:</span><span class="value">${savedDetails.taxPercentage || 'N/A'}%</span></div>
                  <div class="field"><span class="label">Opening Time:</span><span class="value">${savedDetails.openingTime || 'N/A'}</span></div>
                  <div class="field"><span class="label">Total Operating Time:</span><span class="value">${savedDetails.totalTime || 'N/A'}</span></div>
                  <div class="field"><span class="label">FSSAI Number:</span><span class="value">${savedDetails.fssaiNumber || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label">Owner/Manager Name:</span><span class="value">${savedDetails.ownerName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Company Licence:</span><span class="value">${savedDetails.companyLicence || 'N/A'}</span></div>
                  <div class="field"><span class="label">${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number:</span><span class="value">${savedDetails.taxNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">PAN Number:</span><span class="value">${savedDetails.panNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">Closing Time:</span><span class="value">${savedDetails.closingTime || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            <div class="section">
              <h3>Special Timings (Overrides)</h3>
              ${savedDetails.specialTimings && savedDetails.specialTimings.length > 0 ? savedDetails.specialTimings.map((special, index) => `
                <div class="row" style="margin-bottom: 10px;">
                  <div class="column" style="width: 100%;">
                    <div class="field"><span class="label">Reason:</span><span class="value">${special.reason}</span></div>
                    <div class="field"><span class="label">Date:</span><span class="value">${special.date}</span></div>
                    <div class="field"><span class="label">Start Time:</span><span class="value">${special.startTime}</span></div>
                    <div class="field"><span class="label">End Time:</span><span class="value">${special.endTime}</span></div>
                    <div class="field"><span class="label">Duration:</span><span class="value">${special.duration}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row"><div class="column"><div class="field"><span class="label">No special timings.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Address Details</h3>
              ${savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; justify-content: flex-start;">
                  <div class="column" style="width: 100%;">
                    <div class="field"><span class="centered-label">Address ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Full Address:</span><span class="value">${formatAddressForPrint(address)}</span></div>
                  </div>
                </div>
              `).join('') : '<div class="row" style="justify-content: flex-start;"><div class="column" style="width: 100%;"><div class="field"><span class="centered-label">No addresses available.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Contact Details</h3>
              ${savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => `
                <div class="row" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                  <div class="column">
                    <div class="field"><span class="centered-label">Contact ${index + 1}:</span><span class="value"></span></div>
                    <div class="field"><span class="label">Phone Number:</span><span class="value">${contact.phoneCountryCode || ''}${contact.phoneNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">WhatsApp Number:</span><span class="value">${contact.whatsappCountryCode || ''}${contact.whatsappNumber || 'N/A'}</span></div>
                    <div class="field"><span class="label">Email Address:</span><span class="value">${contact.emailAddress || 'N/A'}</span></div>
                    ${contact.websites && contact.websites.length > 0 ? contact.websites.map((website, wIndex) => website ? `
                      <div class="field"><span class="label">Website ${wIndex + 1}:</span><span class="value">${website}</span></div>
                    ` : '').join('') : ''}
                  </div>
                </div>
              `).join('') : '<div class="row" style="justify-content: flex-start;"><div class="column" style="width: 100%;"><div class="field"><span class="centered-label">No contacts available.</span><span class="value"></span></div></div></div>'}
            </div>
            <div class="section">
              <h3>Bank Details</h3>
              <div class="row">
                <div class="column">
                  <div class="field"><span class="label">Bank Name:</span><span class="value">${savedDetails.bankName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Account Number:</span><span class="value">${savedDetails.accountNumber || 'N/A'}</span></div>
                  <div class="field"><span class="label">UPI ID:</span><span class="value">${savedDetails.upiId || 'N/A'}</span></div>
                </div>
                <div class="column">
                  <div class="field"><span class="label">Account Holder Name:</span><span class="value">${savedDetails.accountHolderName || 'N/A'}</span></div>
                  <div class="field"><span class="label">Branch Code:</span><span class="value">${savedDetails.ifscCode || 'N/A'}</span></div>
                  <div class="field"><span class="label">Currency Type:</span><span class="value">${savedDetails.currencyType || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            <hr class="divider" />
            <div class="footer">Company Name: ${savedDetails.restaurantName || 'N/A'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* ADD NEW VALUE MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', width: '300px' }}>
            <h3>Add New Value</h3>
            <p>For {modalField} (comma separate for multiple)</p>
            <input type="text" value={modalValue} onChange={e => setModalValue(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '5px 15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveModal} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Main Container - Like EmployeeList Card - UPDATED: Increased maxWidth to 1200px, Added overflow-y: auto for scrollable content */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 120px)',
        overflowX: 'hidden'
      }}>
        {/* Header with Title and Working Hours Button - Styled like EmployeeList Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div> {/* Empty left for balance */}
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaBuilding style={{ color: '#3498db', fontSize: '2rem' }} />
            Company Details
          </h2>
        </div>
        {/* Error and Message - Styled like EmployeeList Alerts */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #e74c3c',
            boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaTrash style={{ fontSize: '1.2rem' }} />
            {error}
          </div>
        )}
        {message && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)',
            color: '#155724',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #28a745',
            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaClock style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {/* NEW: Warning Message */}
        {warning && (
          <div style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
            color: '#856404',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #f39c12',
            boxShadow: '0 2px 4px rgba(243, 156, 18, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaTrash style={{ fontSize: '1.2rem', color: '#f39c12' }} />
            {warning}
          </div>
        )}
        {/* UPDATED: Tabs - flexWrap: 'nowrap' for single line */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#3498db', padding: '10px', borderRadius: '10px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <button
            onClick={() => toggleSection('details')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'details' ? '#fff' : 'transparent',
              color: activeSection === 'details' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Details
          </button>
          <button
            onClick={() => toggleSection('basic')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'basic' ? '#fff' : 'transparent',
              color: activeSection === 'basic' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Basic Information
          </button>
          {/* NEW: Timing Tab Button */}
          <button
            onClick={() => toggleSection('timing')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'timing' ? '#fff' : 'transparent',
              color: activeSection === 'timing' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <FaClock /> Timing
          </button>
          <button
            onClick={() => toggleSection('address')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'address' ? '#fff' : 'transparent',
              color: activeSection === 'address' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Address Details
          </button>
          <button
            onClick={() => toggleSection('contact')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'contact' ? '#fff' : 'transparent',
              color: activeSection === 'contact' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Contact Details
          </button>
          <button
            onClick={() => toggleSection('payment')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeSection === 'payment' ? '#fff' : 'transparent',
              color: activeSection === 'payment' ? '#3498db' : '#fff',
              border: '1px solid #fff',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Bank Details
          </button>
        </div>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* MODIFIED: Details section with single column for proper line display like image, added specialTimings, and NEW companyLicence */}
          {activeSection === 'details' && (
            <div>
              {/* A4 Sheet Styled Container */}
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '25px',
                margin: '20px 0',
                borderRadius: '5px'
              }}>
                {/* Header: Logo (left) + Title (right) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                }}>
                  {/* Logo */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'contain',
                        borderRadius: '10px',
                        border: '1px solid #ddd'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      border: '1px dashed #ccc',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888',
                      fontSize: '12px',
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      No Logo Uploaded
                    </div>
                  )}
                  {/* Title */}
                  <h3 style={{ color: '#2c3e50', fontSize: '1.8rem', margin: 0, textAlign: 'right', fontWeight: '600' }}>
                    Company Details<br />Application
                  </h3>
                </div>
                {/* Border Line */}
                <hr style={{ border: '0', borderTop: '2px solid #3498db', marginBottom: '25px' }} />
                {/* Saved Details Content - Single Column for Exact Line Display */}
                {savedDetails ? (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {/* Basic Information - UPDATED: Added Company Licence after Owner Name */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Basic Information</h4>
                      <div style={{ width: '100%', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Restaurant Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.restaurantName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Owner/Manager Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.ownerName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Company Licence :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.companyLicence || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Business Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.businessType || 'N/A'}{savedDetails.businessType === 'Other' ? ` (${savedDetails.otherBusinessType || 'N/A'})` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Tax Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxType || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Tax Percentage :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxPercentage || 'N/A'}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Opening Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.openingTime ? formatTo24Hour(savedDetails.openingTime) : 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Closing Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.closingTime ? formatTo24Hour(savedDetails.closingTime) : 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Total Operating Time :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.totalTime || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>FSSAI Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.fssaiNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>${savedDetails.taxType === 'GST' ? 'GST' : 'VAT'} Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.taxNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>PAN Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.panNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {/* NEW: Special Timings Section */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Special Timings (Overrides)</h4>
                      {savedDetails.specialTimings && savedDetails.specialTimings.length > 0 ? savedDetails.specialTimings.map((special, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Special {index + 1} :</strong>
                            <span style={{ flex: 1 }}></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Reason :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.reason}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Date :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Start Time :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{formatTo24Hour(special.startTime)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>End Time :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{formatTo24Hour(special.endTime)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Duration :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{special.duration}</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No special timings available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Address Details - UPDATED: Use formatAddressForPrint, Single Column */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Address Details</h4>
                      {savedDetails.addresses && savedDetails.addresses.length > 0 ? savedDetails.addresses.map((address, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Address {index + 1} :</strong>
                            <span style={{ flex: 1 }}></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                            <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Full Address :</strong>
                            <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{formatAddressForPrint(address)}</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No addresses available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Contact Details - Single Column, UPDATED for country codes and multiple websites */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Contact Details</h4>
                      {savedDetails.contacts && savedDetails.contacts.length > 0 ? savedDetails.contacts.map((contact, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '10px', fontSize: '0.95rem' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>Contact {index + 1} :</strong>
                              <span style={{ flex: 1 }}></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Phone Number :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.phoneCountryCode || ''}{contact.phoneNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>WhatsApp Number :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.whatsappCountryCode || ''}{contact.whatsappNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                              <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Email Address :</strong>
                              <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{contact.emailAddress || 'N/A'}</span>
                            </div>
                            {contact.websites && contact.websites.length > 0 && contact.websites.map((website, wIndex) => website ? (
                              <div key={wIndex} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                                <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Website {wIndex + 1} :</strong>
                                <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{website}</span>
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', color: '#333', fontWeight: 'bold' }}>No contacts available.</strong>
                          <span style={{ flex: 1 }}></span>
                        </div>
                      )}
                    </div>
                    {/* Bank Details - Single Column */}
                    <div className="section">
                      <h4 style={{ color: '#2c3e50', fontSize: '1.3rem', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>Bank Details</h4>
                      <div style={{ width: '100%', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Bank Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.bankName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Account Holder Name :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.accountHolderName || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Account Number :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.accountNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Branch Code :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.ifscCode || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>UPI ID :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.upiId || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                          <strong style={{ minWidth: '200px', textAlign: 'left', paddingRight: '10px', color: '#555', fontWeight: 'bold' }}>Currency Type :</strong>
                          <span style={{ flex: 1, textAlign: 'left', color: '#000' }}>{savedDetails.currencyType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {/* This print button is inside the 'details' section */}
                    <button
                      onClick={handlePrint}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginTop: '10px',
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                      onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
                    >
                      Print Details
                    </button>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem' }}>No saved details available. Please fill out the form sections.</p>
                )}
              </div>
            </div>
          )}
          {activeSection === 'basic' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Basic Information</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Restaurant Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Owner / Manager Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                {/* NEW: Company Licence Input after Owner Name */}
                <input
                  type="text"
                  name="companyLicence"
                  value={formData.companyLicence}
                  onChange={handleChange}
                  placeholder="Company Licence (optional)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                >
                  <option value="">Select Business Type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Café">Café</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Bar">Bar</option>
                  <option value="Other">Other</option>
                </select>
                {formData.businessType === 'Other' && (
                  <input
                    type="text"
                    name="otherBusinessType"
                    value={formData.otherBusinessType}
                    onChange={handleChange}
                    placeholder="Enter other business type"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                )}
                <select
                  name="taxType"
                  value={formData.taxType}
                  onChange={handleChange}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                >
                  <option value="">Select Tax Type</option>
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                </select>
                <input
                  type="number"
                  name="taxPercentage"
                  value={formData.taxPercentage}
                  onChange={handleChange}
                  placeholder="Tax Percentage (e.g., 18)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder={getTaxLabel() + " (optional)"}
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="fssaiNumber"
                  value={formData.fssaiNumber}
                  onChange={handleChange}
                  placeholder="FSSAI Number (optional)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="PAN Number (optional)"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
              </div>
            </div>
          )}
          {/* UPDATED: Timing Section - Added Special Timings sub-section */}
          {activeSection === 'timing' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>
                <FaClock style={{ marginRight: '8px' }} /> Timing Details
              </h3>
              <div style={{ display: 'grid', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>
                  Set your business operating hours below. Total time is auto-calculated.
                </div>
                <input
                  type="time"
                  name="openingTime"
                  value={formatTo24Hour(formData.openingTime)}
                  onChange={handleOpeningTimeChange}
                  placeholder="Start Time"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="time"
                  name="closingTime"
                  value={formatTo24Hour(formData.closingTime)}
                  onChange={handleClosingTimeChange}
                  placeholder="End Time"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="text"
                  value={formData.totalTime}
                  readOnly
                  placeholder="Total Operating Time (auto-calculated)"
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#3498db'
                  }}
                />
                <div style={{ textAlign: 'center', color: '#27ae60', fontSize: '0.9rem' }}>
                  <FaCalendarAlt /> Note: This applies to daily operations. Customize per day in Working Hours page if needed.
                </div>
              </div>
              {/* NEW: Special Timings Sub-Section */}

            </div>
          )}
          {/* UPDATED: Address section with dynamic fields and remove button */}
          {activeSection === 'address' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Address Details</h3>
              {formData.addresses.map((address, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                  <h4 style={{ textAlign: 'center', margin: '5px 0' }}>Address {index + 1}</h4>
                  {/* Country */}
                  <SearchableSelect
                    options={countryList}
                    value={address.country}
                    onChange={(value) => handleAddressFieldChange(index, 'country', value)}
                    placeholder="Select Country"
                  />

                  {(() => {
                    const labels = getAddressLabels(address.country, addressStructure);
                    const field1Label = labels[0];
                    const field2Label = labels[1];
                    const field3Label = labels[2];

                    return (
                      <>
                        {/* Field1 */}
                        {field1Label && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>{field1Label}</label>
                            <SearchableSelect
                              options={getOptionsForField('field1', address.country, addressStructure, linkedValues)}
                              value={address.field1}
                              onChange={(value) => handleAddressFieldChange(index, 'field1', value)}
                              placeholder={`Select ${field1Label}`}
                              allowCreateNew={true}
                              onAddNewValue={val => handleAddNewAddressValue('field1', val, address.country)}
                              onCreateRequest={val => handleOpenAddModal('field1', val, address.country, null, index)}
                            />
                          </div>
                        )}
                        {/* Field2 */}
                        {field2Label && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>{field2Label}</label>
                            <SearchableSelect
                              options={getOptionsForField('field2', address.country, addressStructure, linkedValues, address.field1)}
                              value={address.field2}
                              onChange={(value) => handleAddressFieldChange(index, 'field2', value)}
                              placeholder={`Select ${field2Label}`}
                              allowCreateNew={true}
                              onAddNewValue={val => handleAddNewAddressValue('field2', val, address.country, address.field1)}
                              onCreateRequest={val => handleOpenAddModal('field2', val, address.country, address.field1, index)}
                            />
                          </div>
                        )}
                        {/* Field3 */}
                        {field3Label && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>{field3Label}</label>
                            <SearchableSelect
                              options={getOptionsForField('field3', address.country, addressStructure, linkedValues, address.field2)}
                              value={address.field3}
                              onChange={(value) => handleAddressFieldChange(index, 'field3', value)}
                              placeholder={`Select ${field3Label}`}
                              allowCreateNew={true}
                              onAddNewValue={val => handleAddNewAddressValue('field3', val, address.country, address.field2)}
                              onCreateRequest={val => handleOpenAddModal('field3', val, address.country, address.field2, index)}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {/* Flat / Villa No */}
                  <input
                    type="text"
                    name="flat_villa_no"
                    value={address.flat_villa_no}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Flat / Villa No"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  {/* Building Name */}
                  <input
                    type="text"
                    name="building_name"
                    value={address.building_name}
                    onChange={(e) => handleAddressChange(index, e)}
                    placeholder="Building Name"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  {/* NEW: Remove Address Button */}
                  {formData.addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaTrash /> Remove Address
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addAddress}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '10px',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                <FaPlus /> Add Address
              </button>
            </div>
          )}
          {/* UPDATED: Contact section with country codes (no labels), multiple websites, and remove button */}
          {activeSection === 'contact' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Contact Details</h3>
              {formData.contacts.map((contact, index) => (
                <div key={index} style={{ display: 'grid', gap: '15px', marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '10px' }}>
                  <h4 style={{ textAlign: 'center', margin: '5px 0' }}>Contact {index + 1}</h4>
                  {/* Phone Number with Country Code */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <CountryCodeSelector
                      selectedCode={contact.phoneCountryCode}
                      onCodeChange={(code) => handleContactCountryCodeChange(index, 'phone', code)}
                    />
                    <input
                      type="text"
                      name="phoneNumber"
                      value={contact.phoneNumber}
                      onChange={(e) => handleContactChange(index, e)}
                      placeholder={`Phone Number (${countryRules.find(r => r.code === contact.phoneCountryCode)?.length || '10'} digits)`}
                      maxLength={countryRules.find(r => r.code === contact.phoneCountryCode)?.length || 15}
                      style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                    />
                  </div>
                  {/* WhatsApp Number with Country Code */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <CountryCodeSelector
                      selectedCode={contact.whatsappCountryCode}
                      onCodeChange={(code) => handleContactCountryCodeChange(index, 'whatsapp', code)}
                    />
                    <input
                      type="text"
                      name="whatsappNumber"
                      value={contact.whatsappNumber}
                      onChange={(e) => handleContactChange(index, e)}
                      placeholder={`WhatsApp Number (${countryRules.find(r => r.code === contact.whatsappCountryCode)?.length || '10'} digits)`}
                      maxLength={countryRules.find(r => r.code === contact.whatsappCountryCode)?.length || 15}
                      style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => copyPhoneToWhatsapp(index)}
                      title="Copy Phone to WhatsApp"
                      style={{
                        padding: '10px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaCopy />
                    </button>
                  </div>
                  <input
                    type="email"
                    name="emailAddress"
                    value={contact.emailAddress}
                    onChange={(e) => handleContactChange(index, e)}
                    placeholder="Email Address"
                    style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                  />
                  {/* Multiple Websites */}
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      Websites <FaLink />
                    </label>
                    {contact.websites.map((website, wIndex) => (
                      <div key={wIndex} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => handleWebsiteChange(index, wIndex, e.target.value)}
                          placeholder={`Website ${wIndex + 1}`}
                          style={{ flex: 1, padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeWebsite(index, wIndex)}
                          style={{ padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addWebsite(index)}
                      style={{ padding: '8px 12px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '5px' }}
                    >
                      <FaPlus /> Add Website
                    </button>
                  </div>
                  {/* NEW: Remove Contact Button */}
                  {formData.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaTrash /> Remove Contact
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addContact}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '10px',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                <FaPlus /> Add Contact
              </button>
            </div>
          )}
          {activeSection === 'payment' && (
            <div>
              <h3 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>Bank Details</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Bank Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="Account Holder Name"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Account Number"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="Branch Code"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="UPI ID"
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
                />
                {/* UPDATED: Currency Type - Read-only, pre-filled from settings */}
                <input
                  type="text"
                  name="currencyType"
                  value={formData.currencyType || systemSettings.currency || ''}
                  onChange={handleChange}
                  placeholder="Currency Type (e.g., INR, USD)"
                  readOnly
                  style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem', backgroundColor: '#f8f9fa' }}
                />
              </div>
            </div>
          )}
          {/* Main Save/Print buttons at the bottom */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#bdc3c7' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                flex: 1,
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '12px 20px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.3s',
                flex: 1,
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
            >
              Print Details
            </button>
          </div>
        </div>
      </div>
      {/* NEW: Edit Modal for Special Timing */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={cancelEditSpecial}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90%',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Edit Special Timing</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input
                type="text"
                value={editingSpecial?.reason || ''}
                onChange={(e) => handleEditChange('reason', e.target.value)}
                placeholder="Reason (e.g., Holiday, Event)"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="date"
                value={editingSpecial?.date || ''}
                onChange={(e) => handleEditChange('date', e.target.value)}
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="time"
                value={editingSpecial?.startTime || ''}
                onChange={(e) => handleEditChange('startTime', e.target.value)}
                placeholder="Start Time"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="time"
                value={editingSpecial?.endTime || ''}
                onChange={(e) => handleEditChange('endTime', e.target.value)}
                placeholder="End Time"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem' }}
              />
              <input
                type="text"
                value={editingSpecial?.duration || ''}
                readOnly
                placeholder="Duration (auto-calculated)"
                style={{ padding: '10px', border: '1px solid #bdc3c7', borderRadius: '10px', fontSize: '1rem', backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button
                onClick={updateSpecialTiming}
                style={{ padding: '10px 15px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaSave /> Update
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ padding: '10px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaTrash /> Delete
              </button>
              <button
                onClick={cancelEditSpecial}
                style={{ padding: '10px 15px', backgroundColor: '#bdc3c7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
            {/* NEW: Inline Delete Confirmation in Modal */}
            {showDeleteConfirm && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 15px 0', color: '#856404' }}>Are you sure you want to delete this special timing? This action cannot be undone.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={confirmDeleteFromModal}
                    style={{ padding: '8px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ padding: '8px 12px', backgroundColor: '#bdc3c7', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        /* Searchable Select */
        .searchable-select {
          position: relative;
          width: 100%;
        }
        .searchable-select input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #bdc3c7;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .searchable-select input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }
        .searchable-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #bdc3c7;
          border-top: none;
          border-radius: 0 0 10px 10px;
          max-height: 200px;
          overflow-y: auto;
          list-style: none;
          margin: 0;
          padding: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .searchable-list li {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }
        .searchable-list li:hover {
          background: #f8f9fa;
        }
        .searchable-list .no-options {
          color: #6c757d;
          font-style: italic;
          cursor: default;
          padding: 12px;
          text-align: center;
        }
        /* NEW: Country Code Selector Styles */
        .country-code-selector ul {
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .country-code-selector button:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}
export default CompanyDetails;