import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function displayCharacter(language, character) {
  const japanese = {
    0:"あ",1:"い",2:"う",3:"え",4:"お",5:"か",6:"き",7:"く",8:"け",9:"こ",
    10:"さ",11:"し",12:"す",13:"せ",14:"そ",15:"た",16:"ち",17:"つ",18:"て",19:"と",
    20:"な",21:"に",22:"ぬ",23:"ね",24:"の",25:"は",26:"ひ",27:"ふ",28:"へ",29:"ほ",
    30:"ま",31:"み",32:"む",33:"め",34:"も",35:"や",36:"ゆ",37:"よ",
    38:"ら",39:"り",40:"る",41:"れ",42:"ろ",43:"わ",44:"ゐ",45:"ゑ",46:"を",47:"ん",48:"ゝ"
  };
  const korean = {
    a:"아",bak:"박",bo:"보",bu:"부",choe:"최",da:"다",dae:"대",deul:"들",do:"도",dong:"동",
    e:"에",eo:"어",eu:"으",eui:"의",eul:"을",eun:"은",ga:"가",geos:"것",geu:"그",gi:"기",
    gim:"김",go:"고",gong:"공",gu:"구",guk:"국",gwa:"과",gye:"계",gyeong:"경",ha:"하",
    hae:"해",han:"한",hwa:"화",i:"이",il:"일",in:"인",iss:"있",ja:"자",jang:"장",je:"제",
    jeok:"적",jeon:"전",jeong:"정",ji:"지",jo:"조",ju:"주",na:"나",neun:"는",ra:"라",
    reul:"를",ri:"리",ro:"로",sa:"사",sang:"상",seo:"서",seong:"성",seu:"스",si:"시",
    so:"소",su:"수",wi:"위",won:"원",yeo:"여",yeon:"연",yong:"용"
  };
  const hindi = {
    ka:"क",kha:"ख",ga:"ग",gha:"घ",nga:"ङ",cha:"च",chha:"छ",ja:"ज",jha:"झ",nya:"ञ",
    Ta:"ट",Tha:"ठ",Da:"ड",Dha:"ढ",Na:"ण",ta:"त",tha:"थ",da:"द",dha:"ध",na:"न",
    pa:"प",pha:"फ",ba:"ब",bha:"भ",ma:"म",ya:"य",ra:"र",la:"ल",va:"व",sha:"श",
    Sha:"ष",sa:"स",ha:"ह",ksha:"क्ष",tra:"त्र",gya:"ज्ञ"
  };
  if (language === "Japanese") return japanese[String(character)] ?? character;
  if (language === "Korean") return korean[character] ?? character;
  if (language === "Hindi") return hindi[character] ?? character;
  return character;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function History() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`${API}/attempts?limit=200`, {
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load history.");
        setAttempts(data.attempts || []);
      } catch (error) {
        setMessage(error.message || "Unable to load practice history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const languages = useMemo(
    () => ["All", ...Array.from(new Set(attempts.map((a) => a.language)))],
    [attempts]
  );

  const filtered = useMemo(
    () => filter === "All" ? attempts : attempts.filter((a) => a.language === filter),
    [attempts, filter]
  );

  const average = attempts.length
    ? attempts.reduce((sum, a) => sum + Number(a.accuracy || 0), 0) / attempts.length
    : 0;

  const correct = attempts.filter((a) => a.is_correct).length;

  return (
    <Page>
      <Navbar>
        <LogoLink to="/dashboard">
          <LogoImage src="/scriptly-logo.png" alt="SCRIPTLY" />
        </LogoLink>
        <NavLinks>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/practice">Practice</Link>
          <Active>History</Active>
          <Link to="/performance">Performance</Link>
        </NavLinks>
      </Navbar>

      <Main>
        <Header>
          <div>
            <Eyebrow>PRACTICE HISTORY</Eyebrow>
            <Title>Your Learning Journey</Title>
            <Subtitle>Review your previous handwriting attempts and improvement.</Subtitle>
          </div>
          <LinkButton to="/practice">Practice Now</LinkButton>
        </Header>

        <Stats>
          <Stat><StatValue>{attempts.length}</StatValue><StatLabel>Total Attempts</StatLabel></Stat>
          <Stat><StatValue>{average.toFixed(1)}%</StatValue><StatLabel>Average Accuracy</StatLabel></Stat>
          <Stat><StatValue>{correct}</StatValue><StatLabel>Correct Attempts</StatLabel></Stat>
          <Stat><StatValue>{attempts.length ? ((correct / attempts.length) * 100).toFixed(0) : 0}%</StatValue><StatLabel>Success Rate</StatLabel></Stat>
        </Stats>

        <Toolbar>
          <SectionTitle>Recent Attempts</SectionTitle>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {languages.map((language) => <option key={language}>{language}</option>)}
          </Select>
        </Toolbar>

        {loading && <Empty>Loading your practice history...</Empty>}
        {!loading && message && <Empty>{message}</Empty>}
        {!loading && !message && filtered.length === 0 && (
          <Empty>No practice attempts found. Start practicing to build your history.</Empty>
        )}

        {!loading && !message && filtered.length > 0 && (
          <TableCard>
            <Table>
              <thead>
                <tr>
                  <th>Character</th>
                  <th>Language</th>
                  <th>Recognized</th>
                  <th>Accuracy</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((attempt) => (
                  <tr key={attempt.id}>
                    <td><Character>{displayCharacter(attempt.language, attempt.character)}</Character></td>
                    <td>{attempt.language}</td>
                    <td>{displayCharacter(attempt.language, attempt.recognized)}</td>
                    <td><Accuracy>{Number(attempt.accuracy || 0).toFixed(1)}%</Accuracy></td>
                    <td>
                      <Result $correct={attempt.is_correct}>
                        {attempt.is_correct ? "✓ Correct" : "✗ Needs Practice"}
                      </Result>
                    </td>
                    <td>{formatDate(attempt.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        )}
      </Main>
    </Page>
  );
}

const Page = styled.div`min-height:100vh;background:#0b0910;color:#eee7f5;`;
const Navbar = styled.nav`height:72px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.07);`;
const LogoLink = styled(Link)`display:flex;align-items:center;`;
const LogoImage = styled.img`width:115px;height:auto;`;
const NavLinks = styled.div`display:flex;gap:24px;align-items:center;font-size:13px;a{color:#aaa0b4;text-decoration:none}.active{color:#fff}`;
const Active = styled.span`color:#fff;`;
const Main = styled.main`width:min(1180px,90%);margin:0 auto;padding:55px 0 80px;`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:30px;`;
const Eyebrow = styled.div`color:#9b7ee7;font-size:11px;letter-spacing:2px;font-weight:700;`;
const Title = styled.h1`margin:8px 0;font-size:34px;`;
const Subtitle = styled.p`margin:0;color:#8f849f;font-size:14px;`;
const LinkButton = styled(Link)`background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;`;
const Stats = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:38px;@media(max-width:750px){grid-template-columns:repeat(2,1fr)}`;
const Stat = styled.div`padding:20px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:14px;`;
const StatValue = styled.div`font-size:25px;font-weight:700;`;
const StatLabel = styled.div`margin-top:6px;color:#8f849f;font-size:11px;`;
const Toolbar = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;`;
const SectionTitle = styled.h2`font-size:18px;margin:0;`;
const Select = styled.select`background:#17131d;color:#eee;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 12px;`;
const TableCard = styled.div`overflow:auto;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.02);`;
const Table = styled.table`width:100%;border-collapse:collapse;min-width:760px;th,td{text-align:left;padding:15px 17px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px}th{color:#8f849f;font-size:10px;letter-spacing:1px;text-transform:uppercase}tr:last-child td{border-bottom:0}`;
const Character = styled.span`font-size:24px;font-weight:600;`;
const Accuracy = styled.span`color:#c9b7f5;font-weight:600;`;
const Result = styled.span`color:${p => p.$correct ? "#8ee6b4" : "#e7a1a1"};`;
const Empty = styled.div`padding:45px 20px;text-align:center;color:#8f849f;border:1px dashed rgba(255,255,255,.1);border-radius:14px;`;

export default History;
