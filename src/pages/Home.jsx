import React from 'react';
import HeroCinematic from '../components/landing/HeroCinematic';
import MarqueeStrip from '../components/landing/MarqueeStrip';
import GamesShowcase from '../components/landing/GamesShowcase';
import CategoriesMarquee from '../components/landing/CategoriesMarquee';
import CulturalContent from '../components/landing/CulturalContent';
import CommonPhrases from '../components/landing/CommonPhrases';
import MultimodalSection from '../components/landing/MultimodalSection';
import AboutTeaser from '../components/landing/AboutTeaser';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/Footer';
import useScrollAnimations from '../hooks/useScrollAnimations';
import '../styles/components/landing/LandingAnimations.css';

const Home = () => {
    useScrollAnimations();

    return (
        <>
            <HeroCinematic />
            <MarqueeStrip />
            <GamesShowcase />
            <CategoriesMarquee />
            <CulturalContent />
            <CommonPhrases />
            <MultimodalSection />
            <AboutTeaser />
            <FinalCTA />
            <Footer />
        </>
    );
};

export default Home;