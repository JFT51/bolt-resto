import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { pipeline, RawAudio } from '@xenova/transformers';

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const dutchSkillKeywords = [
  // Technical Skills
  'javascript', 'react', 'react.js', 'angular', 'vue', 'python', 'java', 'c#', '.net', 'php', 'ruby', 'swift', 'kotlin',
  'node.js', 'express.js', 'django', 'flask', 'spring boot',
  'sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'firebase',
  'docker', 'kubernetes', 'jenkins', 'git', 'svn', 'ci/cd',
  'aws', 'azure', 'google cloud', 'gcp',
  'html', 'css', 'sass', 'less', 'typescript',
  'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd', 'invision', 'zeplin', 'canva', // Added more design
  'jira', 'confluence', 'trello', 'asana', 'slack', // Added project tools
  'sap', 'salesforce', 'oracle', 'tableau', 'power bi',
  'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'scikit-learn',
  'cybersecurity', 'networking', 'linux', 'windows server', 'api', 'restful apis', 'api-ontwikkeling', // Added api-ontwikkeling
  'frontend', 'backend', 'fullstack', // Added roles/areas
  'data-analyse', 'business intelligence', 'erp', 'crm', // Added IT concepts
  // Office Software
  'excel', 'word', 'powerpoint', 'outlook', 'office 365', 'microsoft office',
  'google workspace', 'google sheets', 'google docs', 'google slides',
  // Soft Skills & Methodologies
  'communicatie', 'teamwork', 'samenwerken', 'probleemoplossend', 'leiderschap', 'management',
  'klantgericht', 'analytisch', 'creatief', 'innovatief', 'presenteren', 'onderhandelen', 'presentatievaardigheden', // Added presentatievaardigheden
  'projectmanagement', 'agile', 'scrum', 'lean', 'prince2', 'waterval',
  'kritisch denken', 'flexibiliteit', 'stressbestendig', 'onderzoek', 'rapportage', 'stakeholdermanagement',
  'klantenservice', 'timemanagement', 'zelfstandig werken', 'initiatief nemen', // Added more soft skills
  // Keywords indicating skills/experience
  'ervaring met', 'kennis van', 'vaardig in', 'gecertificeerd in', 'expert in', 'bedreven in', 'competent in',
  'beheersing van', 'gespecialiseerd in', 'vaardigheden', 'competenties', 'technologieën', 'methodieken',
  // Education/Certification related
  'bachelor', 'master', 'doctoraat', 'phd', 'certificaat', 'gecertificeerd', 'diploma', 'cursus', 'opleiding', 'training'
];

const initialNlpStatus = "Nog geen analyse uitgevoerd.";

function App() {
  const [cvText, setCvText] = useState('');
  const [prioritySkillsInput, setPrioritySkillsInput] = useState('');
  const [prioritySkills, setPrioritySkills] = useState([]);
  const [rankedSkills, setRankedSkills] = useState([]);
  // const [skillScores, setSkillScores] = useState({}); // Kept for potential future debug, but not displayed

  const [candidateCategory, setCandidateCategory] = useState('');
  const [matchPercentage, setMatchPercentage] = useState(0);

  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState('');

  const [nlpProcessing, setNlpProcessing] = useState(false);
  // const [cvNlpResults, setCvNlpResults] = useState(null);
  // const [transcriptNlpResults, setTranscriptNlpResults] = useState(null);
  const [nlpError, setNlpError] = useState('');
  const [nlpModelName, setNlpModelName] = useState('Xenova/bert-base-multilingual-cased-ner-hrl');
  const [nlpStatus, setNlpStatus] = useState(initialNlpStatus);

  const [extractedCvSkills, setExtractedCvSkills] = useState([]);
  const [extractedTranscriptSkills, setExtractedTranscriptSkills] = useState([]);

  useEffect(() => {
    const parseAndSetPrioritySkills = () => {
      const parsed = prioritySkillsInput
        .split(',')
        .map(part => {
          const [skill, weightStr] = part.split(':');
          const trimmedSkill = skill.trim().toLowerCase();
          if (!trimmedSkill) return null;
          const weight = parseInt(weightStr, 10);
          return { skill: trimmedSkill, weight: isNaN(weight) ? 3 : Math.max(1, Math.min(weight, 10)) };
        })
        .filter(Boolean);
      setPrioritySkills(parsed);
    };
    parseAndSetPrioritySkills();
  }, [prioritySkillsInput]);


  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setCvText('Bezig met laden van PDF...');
    setExtractedCvSkills([]);
    setRankedSkills([]);
    setMatchPercentage(0); setCandidateCategory('');
    setNlpStatus(initialNlpStatus); setNlpError('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const pdfPage = await pdfDoc.getPage(i);
          const textContent = await pdfPage.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        setCvText(fullText.trim() || "Geen tekst gevonden in PDF.");
      } catch (error) { console.error('Error parsing PDF:', error); setCvText('Fout bij het parsen van PDF: ' + error.message); }
    };
    reader.onerror = (error) => { console.error('FileReader error:', error); setCvText('Fout bij het lezen van het PDF-bestand.'); };
    reader.readAsArrayBuffer(file);
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file); setTranscript('');
      setExtractedTranscriptSkills([]);
      setRankedSkills([]);
      setMatchPercentage(0); setCandidateCategory('');
      setNlpStatus(initialNlpStatus); setNlpError('');
      setTranscriptionError(''); setTranscriptionStatus('Audiobestand geselecteerd. Klik op "Transcriptie Starten".');
    }
  };

  const transcribeAudio = useCallback(async () => {
    if (!audioFile) { setTranscriptionError('Geen audiobestand geselecteerd.'); return; }
    setTranscribing(true); setTranscript('');
    setExtractedTranscriptSkills([]);
    setRankedSkills([]);
    setMatchPercentage(0); setCandidateCategory('');
    setNlpStatus(initialNlpStatus); setNlpError('');
    setTranscriptionError(''); setTranscriptionStatus('Audio aan het voorbereiden...');
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
      const targetSampleRate = 16000;
      let audioData;
      if (decodedAudio.sampleRate === targetSampleRate) { audioData = decodedAudio.getChannelData(0); }
      else {
        const offlineContext = new OfflineAudioContext(decodedAudio.numberOfChannels, (decodedAudio.duration * targetSampleRate), targetSampleRate);
        const bufferSource = offlineContext.createBufferSource(); bufferSource.buffer = decodedAudio;
        bufferSource.connect(offlineContext.destination); bufferSource.start();
        const resampledAudioBuffer = await offlineContext.startRendering();
        audioData = resampledAudioBuffer.getChannelData(0);
      }
      const rawAudio = new RawAudio(audioData, targetSampleRate);
      setTranscriptionStatus('Transcriber initialiseren (model downloaden)...');
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
        progress_callback: (progress) => setTranscriptionStatus(`Audio Model laden: ${progress.file} (${Math.round(progress.progress)}%)`)
      });
      setTranscriptionStatus('Bezig met transcriberen...');
      const output = await transcriber(rawAudio, { language: 'dutch', task: 'transcribe' });
      setTranscript(output.text || "Geen transcriptie resultaat.");
      setTranscriptionStatus('Transcriptie voltooid.');
    } catch (error) { console.error('Transcription error:', error); setTranscriptionError(`Fout tijdens transcriptie: ${error.message}`); setTranscriptionStatus('Transcriptie mislukt.'); }
    finally { setTranscribing(false); }
  }, [audioFile]);

  const extractSkills = useCallback(async (text, nerResults, type) => {
    const uniqueSkills = new Set();
    const cleanedText = text ? text.toLowerCase() : "";
    if (nerResults && Array.isArray(nerResults)) {
      nerResults.forEach(entity => {
        if (entity.entity_group === 'MISC' || entity.entity_group === 'ORG' || entity.entity_group === 'PER') {
          const potentialSkill = entity.word.toLowerCase().trim().replace(/^##/, '');
          if (potentialSkill.length > 2 && !/^\d+$/.test(potentialSkill)) {
            if (dutchSkillKeywords.includes(potentialSkill) || potentialSkill.includes('.') || potentialSkill.includes('-') || potentialSkill.includes('js') || entity.score > 0.85) {
                 uniqueSkills.add(potentialSkill);
            }
          }
        }
      });
    }
    if (cleanedText) {
      dutchSkillKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(cleanedText)) { uniqueSkills.add(keyword.toLowerCase()); }
      });
    }
    const skillsArray = Array.from(uniqueSkills).sort();
    if (type === 'cv') { setExtractedCvSkills(skillsArray); }
    else if (type === 'transcript') { setExtractedTranscriptSkills(skillsArray); }
    return skillsArray;
  }, []);

  const calculateMatchPercentage = useCallback((currentRankedSkills, currentPrioritySkills) => {
    if (!currentPrioritySkills || currentPrioritySkills.length === 0) { setMatchPercentage(0); return 0; }
    let totalPriorityWeight = 0;
    let achievedPriorityWeight = 0;
    currentPrioritySkills.forEach(pSkill => {
      totalPriorityWeight += pSkill.weight;
      const foundRankedSkill = currentRankedSkills.find(rs => rs.skill.toLowerCase() === pSkill.skill.toLowerCase());
      if (foundRankedSkill) { achievedPriorityWeight += pSkill.weight; }
    });
    const perc = totalPriorityWeight === 0 ? 0 : (achievedPriorityWeight / totalPriorityWeight) * 100;
    setMatchPercentage(parseFloat(perc.toFixed(1)));
    return perc;
  }, []);

  const categorizeCandidate = useCallback((calculatedPerc, currentRankedSkills, currentTransSkills, currentPriorSkills) => {
    const HIGH_MATCH_THRESHOLD = 70;
    const POTENTIAL_THRESHOLD = 40;
    const MIN_SKILLS_FOR_COMMUNICATOR = 4;
    const MIN_PRIORITY_SKILLS_FOR_HIGH_MATCH = currentPriorSkills.length > 0 ? Math.max(1, Math.floor(currentPriorSkills.length / 2.5)) : 0;
    let category = "Nog niet gecategoriseerd";

    if (currentPriorSkills.length === 0) {
        if (currentRankedSkills.length >= 7) { category = 'Veelzijdige Kandidaat (Geen Prioriteiten Gesteld)'; }
        else if (currentRankedSkills.length > 0 && currentRankedSkills.length < 7) { category = 'Enkele Vaardigheden Gedetecteerd (Geen Prioriteiten Gesteld)';} // Refined
        else if (currentTransSkills.length >= MIN_SKILLS_FOR_COMMUNICATOR) { category = 'Communicatief Sterk (Geen Prioriteiten Gesteld)'; }
        else { category = 'Geen Duidelijke Vaardigheden Gedetecteerd (Geen Prioriteiten Gesteld)'; } // Refined
        setCandidateCategory(category); return;
    }

    let foundPriorityInRankedCount = 0;
    currentPriorSkills.forEach(pSkill => {
        if(currentRankedSkills.some(rs => rs.skill.toLowerCase() === pSkill.skill.toLowerCase() && rs.priority)) {
            foundPriorityInRankedCount++;
        }
    });

    if (calculatedPerc >= HIGH_MATCH_THRESHOLD && foundPriorityInRankedCount >= MIN_PRIORITY_SKILLS_FOR_HIGH_MATCH) {
      category = 'Hooggekwalificeerd (Uitstekende Match)';
    } else if (calculatedPerc >= POTENTIAL_THRESHOLD) {
      if (currentTransSkills.length >= MIN_SKILLS_FOR_COMMUNICATOR && calculatedPerc < HIGH_MATCH_THRESHOLD -15) {
        category = 'Goede Communicator, Mist Enkele Kernvaardigheden';
      } else {
        category = 'Potentieel, Overweeg Gesprek';
      }
    } else {
      if (currentTransSkills.length >= MIN_SKILLS_FOR_COMMUNICATOR && calculatedPerc > 10) {
        category = 'Communicatief Vaardig, Maar Ondergekwalificeerd';
      } else if (currentTransSkills.length < MIN_SKILLS_FOR_COMMUNICATOR && calculatedPerc > 10 && currentRankedSkills.length > 3) {
        category = 'Enige Vaardigheden Aanwezig, Lage Prioriteitsmatch';
      }
      else {
        category = 'Lage Prioriteitsmatch en Beperkte Overige Vaardigheden';
      }
    }
    setCandidateCategory(category);
  }, []);


  const rankSkills = useCallback(async (currentCvSkills, currentTranscriptSkills, currentPrioritySkillsRef) => {
    setNlpStatus(prev => `${prev} Starten met ranken... `);
    const localSkillScores = {};
    const combinedUniqueSkills = Array.from(new Set([...currentCvSkills, ...currentTranscriptSkills]));

    combinedUniqueSkills.forEach(skill => {
      localSkillScores[skill] = { score: 0, sources: [], priority: false };
      let baseScore = 0;
      if (currentCvSkills.includes(skill)) { baseScore += 1.5; localSkillScores[skill].sources.push('CV'); }
      if (currentTranscriptSkills.includes(skill)) { baseScore += 1; localSkillScores[skill].sources.push('Transcript'); }
      localSkillScores[skill].score = baseScore;

      const priorityEntry = currentPrioritySkillsRef.find(pSkill => pSkill.skill === skill.toLowerCase());
      if (priorityEntry) { localSkillScores[skill].score += priorityEntry.weight * 2.5; localSkillScores[skill].priority = true; }
    });
    const sortedRankedSkills = Object.entries(localSkillScores)
      .map(([skill, details]) => ({ skill, score: parseFloat(details.score.toFixed(2)), sources: details.sources, priority: details.priority }))
      .sort((a, b) => b.score - a.score);
    setRankedSkills(sortedRankedSkills);

    const perc = calculateMatchPercentage(sortedRankedSkills, currentPrioritySkillsRef);
    categorizeCandidate(perc, sortedRankedSkills, currentTranscriptSkills, currentPrioritySkillsRef);

    setNlpStatus(prev => `${prev} Ranking & Categorisatie voltooid.`);
  }, [calculateMatchPercentage, categorizeCandidate]);

  const processTextWithNlp = useCallback(async (text, type, fullTextForSkills) => {
    if (!text) {
      if (type === 'cv') setExtractedCvSkills([]); else setExtractedTranscriptSkills([]);
      return null;
    }
    setNlpError('');
    let currentNlpStatus = `NLP (${type}) Model laden... `;
    setNlpStatus(prev => `${prev.split("NLP")[0]} ${currentNlpStatus}`);
    try {
      const nerPipeline = await pipeline('token-classification', nlpModelName, {
        progress_callback: (progress) => {
          setNlpStatus(prev => `${prev.split(" Model laden")[0]} Model laden (${type}): ${progress.file} (${Math.round(progress.progress)}%) `);
        }
      });
      setNlpStatus(prev => `${prev.split(" Entiteiten")[0]} Entiteiten extraheren (${type})... `);
      const entities = await nerPipeline(text.substring(0, 5000));

      // NER results are used by extractSkills, not stored in state directly for UI
      if (type === 'cv') { return await extractSkills(fullTextForSkills || text, entities, 'cv'); }
      else if (type === 'transcript') { return await extractSkills(fullTextForSkills || text, entities, 'transcript');} // This was a bug, should be 'transcript'

    } catch (error) {
      console.error(`NLP error (${type}):`, error); setNlpError(`Fout NLP (${type}): ${error.message}`);
      setNlpStatus(prev => `${prev.split(" NLP")[0]} NLP (${type}) mislukt. `);
      if (type === 'cv') setExtractedCvSkills([]); else setExtractedTranscriptSkills([]);
      return null;
    }
  }, [nlpModelName, extractSkills]);

  // Corrected version of processTextWithNlp for transcript
  const processTranscriptWithNlp = useCallback(async (text, type, fullTextForSkills) => {
    if (!text) {
      setExtractedTranscriptSkills([]);
      return null;
    }
    setNlpError('');
    let currentNlpStatus = `NLP (${type}) Model laden... `;
    setNlpStatus(prev => `${prev.split("NLP")[0]} ${currentNlpStatus}`);
    try {
      const nerPipeline = await pipeline('token-classification', nlpModelName, {
        progress_callback: (progress) => {
          setNlpStatus(prev => `${prev.split(" Model laden")[0]} Model laden (${type}): ${progress.file} (${Math.round(progress.progress)}%) `);
        }
      });
      setNlpStatus(prev => `${prev.split(" Entiteiten")[0]} Entiteiten extraheren (${type})... `);
      const entities = await nerPipeline(text.substring(0, 5000));
      return await extractSkills(fullTextForSkills || text, entities, 'transcript');

    } catch (error) {
      console.error(`NLP error (${type}):`, error); setNlpError(`Fout NLP (${type}): ${error.message}`);
      setNlpStatus(prev => `${prev.split(" NLP")[0]} NLP (${type}) mislukt. `);
      setExtractedTranscriptSkills([]);
      return null;
    }
  }, [nlpModelName, extractSkills]);


  const handleAnalyzeTexts = async () => {
    setNlpProcessing(true);
    setRankedSkills([]);
    setMatchPercentage(0); setCandidateCategory('');
    setNlpStatus("Starten analyses... ");
    let cvSkillsResult = []; let transcriptSkillsResult = [];

    if (cvText && cvText !== "Geen tekst gevonden in PDF." && !cvText.startsWith("Fout bij")) {
      cvSkillsResult = await processTextWithNlp(cvText, 'cv', cvText) || [];
    } else {
      setExtractedCvSkills([]);
      setNlpStatus(prev => `${prev} CV overgeslagen. `);
    }

    if (transcript && transcript !== "Geen transcriptie resultaat." && !transcript.startsWith("Fout bij")) {
      // Use the corrected function for transcript processing
      transcriptSkillsResult = await processTranscriptWithNlp(transcript, 'transcript', transcript) || [];
    } else {
      setExtractedTranscriptSkills([]);
      setNlpStatus(prev => `${prev} Transcript overgeslagen. `);
    }

    await rankSkills(cvSkillsResult, transcriptSkillsResult, prioritySkills);
    setNlpProcessing(false);
  };

  const hasContent = (text) => text && !text.startsWith("Bezig met") && !text.startsWith("Fout bij") && !text.startsWith("Geen tekst");

  return (
    <div className="App">
      <header className="App-header"><h1>Surveasy - Kandidaat Analyse</h1></header>
      <main>
        <section className="upload-section">
          <h2>Uploads</h2>
          <div className="dropzone"><p>CV Uploaden (PDF)</p><input type="file" accept=".pdf" onChange={handlePdfUpload} /></div>
          <div className="dropzone">
            <p>Interview Uploaden (Audio)</p><input type="file" accept="audio/*" onChange={handleAudioUpload} />
            {audioFile && <button onClick={transcribeAudio} disabled={transcribing} style={{marginTop: '10px'}}>
              {transcribing ? 'Bezig met Transcriptie...' : 'Interview Transcriptie Starten'}
            </button>}
            {transcriptionStatus && !transcribing && <p className="status-message small-status">{transcriptionStatus}</p>}
            {transcriptionError && <p className="error-message small-status">{transcriptionError}</p>}
          </div>
        </section>

        <section className="skills-section">
          <h2>Prioritaire Vaardigheden & Analyse</h2>
          <div>
            <label htmlFor="priority-skills-input">Prioritaire Vaardigheden (skill:gewicht, bv. java:5)</label>
            <textarea id="priority-skills-input" rows="3" value={prioritySkillsInput} onChange={(e) => setPrioritySkillsInput(e.target.value)} placeholder="bv. javascript:5, react:4, communicatie:3"></textarea>
          </div>
          <div>
            <button onClick={handleAnalyzeTexts} disabled={nlpProcessing || (!hasContent(cvText) && !hasContent(transcript))}>
              {nlpProcessing ? 'Bezig met Analyse...' : 'Analyseer & Categoriseer'}
            </button>
            {nlpStatus !== initialNlpStatus && <p className="status-message"><i>Status: {nlpStatus}</i></p>}
            {nlpError && <p className="error-message"><i>Fout: {nlpError}</i></p>}
          </div>
        </section>

        <section className="results-section">
          <h2>Resultaten Overzicht</h2>

          {(matchPercentage > 0 || candidateCategory) && ( // Show if either has a value
            <div className="result-placeholder" id="categorization-summary">
              <h3>Kandidaat Status</h3>
              <p><strong>Match Percentage (Prioriteiten):</strong> {matchPercentage}%</p>
              <p><strong>Kandidaat Categorie:</strong> {candidateCategory || "Nog niet gecategoriseerd"}</p>
            </div>
          )}

          {rankedSkills.length > 0 && (
            <div className="result-placeholder">
              <h3>Gerangschikte Vaardigheden</h3>
              <ol className="ranked-skills-list">
                {rankedSkills.map(item => (
                  <li key={item.skill} title={`Bronnen: ${item.sources.join(', ')}${item.priority ? ' (Prioritair)' : ''}`}>
                    {item.skill} (Score: {item.score})
                    {item.priority && <span className="priority-flag"> ★</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {extractedCvSkills.length > 0 && (
            <div className="result-placeholder">
              <h3>Geëxtraheerde Vaardigheden (CV)</h3>
              <ul className="skills-list">{extractedCvSkills.map(skill => <li key={`cv-${skill}`}>{skill}</li>)}</ul>
            </div>
          )}

          {extractedTranscriptSkills.length > 0 && (
            <div className="result-placeholder">
              <h3>Geëxtraheerde Vaardigheden (Transcript)</h3>
               <ul className="skills-list">{extractedTranscriptSkills.map(skill => <li key={`tr-${skill}`}>{skill}</li>)}</ul>
            </div>
          )}

          {hasContent(cvText) && (
            <div className="result-placeholder"><h3>Brontekst CV</h3><pre className="text-display-area">{cvText}</pre></div>
          )}

          {hasContent(transcript) && (
            <div className="result-placeholder">
              <h3>Brontekst Interview Transcriptie</h3>
              <pre className="text-display-area">{transcript}</pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export default App;
