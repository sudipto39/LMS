/**
 * excelExport.ts
 * Pure TypeScript Excel export utility — zero dependencies.
 * Generates Excel 2003 XML SpreadsheetML (.xls) files as Blobs,
 * which are natively opened by Microsoft Excel, Google Sheets & LibreOffice.
 */

import ExcelJS from 'exceljs';
import type { ContinuousEvaluationRow, CourseEvaluationMetadata } from '../types/evaluation';

export interface StudentProjectRow {
  studentName: string;
  universityId: string;
  department: string;
  projectTitle: string;
  technologies: string;
  status: string;
  progress: number;
  supervisor: string;
  batch: string;
  startDate: string;
  endDate: string;
  milestonesTotal: number;
  milestonesApproved: number;
}

export interface GradeRow {
  studentName: string;
  projectTitle: string;
  score: number | string;
  grade: string;
  status: string;
  supervisorFeedback: string;
  gradedAt: string;
  codeQuality: number | string;
  documentation: number | string;
  presentation: number | string;
  innovation: number | string;
  teamwork: number | string;
}

// ─── XML Helpers ──────────────────────────────────────────────────────────────

function escapeXml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cell(value: unknown, type: 'String' | 'Number' = 'String'): string {
  const escaped = escapeXml(value);
  if (type === 'Number' && escaped !== '' && !isNaN(Number(escaped))) {
    return `<Cell><Data ss:Type="Number">${escaped}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
}

function headerCell(value: string): string {
  return `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function groupHeaderCell(value: string, span: number): string {
  return `<Cell ss:StyleID="groupHeader" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function row(...cells: string[]): string {
  return `<Row>${cells.join('')}</Row>`;
}

// ─── Workbook wrapper ─────────────────────────────────────────────────────────

function buildWorkbook(sheets: { name: string; content: string }[]): string {
  const styles = `
<Styles>
  <Style ss:ID="header">
    <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#0F2A38" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1A4454"/>
    </Borders>
  </Style>
  <Style ss:ID="groupHeader">
    <Font ss:Bold="1" ss:Color="#0E4A5E" ss:Size="11" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#E0F0F5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="even">
    <Interior ss:Color="#F8FCFD" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="badge_green">
    <Font ss:Color="#15803D" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_blue">
    <Font ss:Color="#0369A1" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_yellow">
    <Font ss:Color="#B45309" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="badge_red">
    <Font ss:Color="#B91C1C" ss:Bold="1" ss:FontName="Segoe UI"/>
    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="title">
    <Font ss:Bold="1" ss:Size="14" ss:Color="#0F2A38" ss:FontName="Segoe UI"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
    <Font ss:Italic="1" ss:Size="9" ss:Color="#64748B" ss:FontName="Segoe UI"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="bold">
    <Font ss:Bold="1" ss:Color="#0F2A38" ss:Size="10" ss:FontName="Segoe UI"/>
  </Style>
</Styles>`;

  const sheetsXml = sheets
    .map(
      s => `
  <Worksheet ss:Name="${escapeXml(s.name)}">
    <Table ss:DefaultRowHeight="20">
      ${s.content}
    </Table>
  </Worksheet>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>GiteaForge LMS</Author>
    <Title>GiteaForge Academic Export</Title>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  ${styles}
  ${sheetsXml}
</Workbook>`;
}

function downloadXls(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function statusCellStyled(status: string): string {
  const s = String(status || '').toUpperCase();
  let styleId = '';
  if (s === 'APPROVED' || s === 'COMPLETED') styleId = 'badge_green';
  else if (s === 'IN_PROGRESS' || s === 'ACTIVE') styleId = 'badge_blue';
  else if (s === 'SUBMITTED' || s === 'PENDING') styleId = 'badge_yellow';
  else if (s === 'REJECTED' || s === 'ARCHIVED') styleId = 'badge_red';

  if (styleId) {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(status)}</Data></Cell>`;
  }
  return cell(status);
}

// ─── Student-wise export ──────────────────────────────────────────────────────

const STUDENT_HEADERS = [
  'Student Name',
  'University ID',
  'Department',
  'Project Title',
  'Technologies',
  'Status',
  'Progress %',
  'Supervisor',
  'Batch',
  'Start Date',
  'End Date',
  'Milestones Total',
  'Milestones Approved',
];

function buildStudentRow(p: StudentProjectRow, idx: number): string {
  const style = idx % 2 === 0 ? '' : ' ss:StyleID="even"';
  return `<Row${style}>
    ${cell(p.studentName)}
    ${cell(p.universityId)}
    ${cell(p.department)}
    ${cell(p.projectTitle)}
    ${cell(p.technologies)}
    ${statusCellStyled(p.status)}
    ${cell(p.progress, 'Number')}
    ${cell(p.supervisor)}
    ${cell(p.batch)}
    ${cell(p.startDate)}
    ${cell(p.endDate)}
    ${cell(p.milestonesTotal, 'Number')}
    ${cell(p.milestonesApproved, 'Number')}
  </Row>`;
}

export function exportStudentProjectsToExcel(
  projects: StudentProjectRow[],
  filename = `student_project_updates_${_dateStamp()}.xls`,
): void {
  if (projects.length === 0) {
    alert('No projects to export.');
    return;
  }

  const headerRow = row(...STUDENT_HEADERS.map(headerCell));
  const dataRows = projects.map((p, i) => buildStudentRow(p, i)).join('\n');

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Student Project Updates</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  const sheetContent = `
    ${metaRow}
    ${headerRow}
    ${dataRows}
  `;

  const xml = buildWorkbook([{ name: 'Student Projects', content: sheetContent }]);
  downloadXls(xml, filename);
}

// ─── Group-wise (batch) export ────────────────────────────────────────────────

export function exportGroupProjectsToExcel(
  projects: StudentProjectRow[],
  filename = `group_project_updates_${_dateStamp()}.xls`,
): void {
  if (projects.length === 0) {
    alert('No projects to export.');
    return;
  }

  // Group by batch
  const byBatch = new Map<string, StudentProjectRow[]>();
  for (const p of projects) {
    const batchName = p.batch || 'Unassigned';
    if (!byBatch.has(batchName)) byBatch.set(batchName, []);
    byBatch.get(batchName)!.push(p);
  }

  const sortedBatches = Array.from(byBatch.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let rowIdx = 0;
  const rows: string[] = [];

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Group-wise Project Updates</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  rows.push(metaRow);

  for (const [batchName, batchProjects] of sortedBatches) {
    rows.push(
      `<Row>${groupHeaderCell(`📁 Batch: ${batchName}  (${batchProjects.length} project${batchProjects.length !== 1 ? 's' : ''})`, STUDENT_HEADERS.length)}</Row>`,
    );
    rows.push(row(...STUDENT_HEADERS.map(headerCell)));
    for (const p of batchProjects) {
      rows.push(buildStudentRow(p, rowIdx));
      rowIdx++;
    }
    rows.push('<Row/>');
  }

  const xml = buildWorkbook([{ name: 'Group Projects', content: rows.join('\n') }]);
  downloadXls(xml, filename);
}

// ─── Supervisor grades export ─────────────────────────────────────────────────

const GRADE_HEADERS = [
  'Student Name',
  'Project Title',
  'Score (/100)',
  'Grade',
  'Project Status',
  'Supervisor Feedback',
  'Graded On',
  'Code Quality',
  'Documentation',
  'Presentation',
  'Innovation',
  'Teamwork',
];

function gradeCellStyled(grade: string, score: number | string): string {
  const s = Number(score);
  let styleId = '';
  if (s >= 80 || grade.startsWith('A')) styleId = 'badge_green';
  else if (s >= 65 || grade.startsWith('B')) styleId = 'badge_blue';
  else if (s >= 50 || grade.startsWith('C')) styleId = 'badge_yellow';
  else if (s > 0 || grade.startsWith('F')) styleId = 'badge_red';

  if (styleId) {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(grade)}</Data></Cell>`;
  }
  return cell(grade);
}

export function exportGradesToExcel(
  grades: GradeRow[],
  filename = `supervisor_grades_${_dateStamp()}.xls`,
): void {
  if (grades.length === 0) {
    alert('No grades to export.');
    return;
  }

  const metaRow = `<Row>
    <Cell ss:StyleID="title"><Data ss:Type="String">GiteaForge LMS — Supervisor Grading Report</Data></Cell>
  </Row>
  <Row>
    <Cell ss:StyleID="subtitle"><Data ss:Type="String">Exported: ${new Date().toLocaleString()}</Data></Cell>
  </Row>
  <Row/>`;

  const headerRow = row(...GRADE_HEADERS.map(headerCell));

  const dataRows = grades.map((g, i) => {
    const style = i % 2 === 0 ? '' : ' ss:StyleID="even"';
    return `<Row${style}>
      ${cell(g.studentName)}
      ${cell(g.projectTitle)}
      ${cell(g.score, 'Number')}
      ${gradeCellStyled(g.grade, g.score)}
      ${statusCellStyled(g.status)}
      ${cell(g.supervisorFeedback)}
      ${cell(g.gradedAt)}
      ${cell(g.codeQuality, 'Number')}
      ${cell(g.documentation, 'Number')}
      ${cell(g.presentation, 'Number')}
      ${cell(g.innovation, 'Number')}
      ${cell(g.teamwork, 'Number')}
    </Row>`;
  });

  // Summary stats row
  const avgScore =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, g) => sum + Number(g.score || 0), 0) /
            grades.length,
        )
      : 0;

  const summaryRow = `<Row/>
  <Row>
    <Cell ss:StyleID="header"><Data ss:Type="String">Summary</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Total Students</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="Number">${grades.length}</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Avg Score</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="Number">${avgScore}</Data></Cell>
  </Row>`;

  const sheetContent = `${metaRow}${headerRow}${dataRows.join('\n')}${summaryRow}`;

  const xml = buildWorkbook([{ name: 'Grades Report', content: sheetContent }]);
  downloadXls(xml, filename);
}

// =============================================================================
// UNIVERSITY CONTINUOUS PRACTICAL EVALUATION REGISTER (100 MARKS) EXPORT
// Matches Sheet 1 (PRACTICAL) of University Evaluation Workbook
// =============================================================================

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportUniversityPracticalRegister(
  evaluations: ContinuousEvaluationRow[],
  metadata?: Partial<CourseEvaluationMetadata>,
  filename = `university_practical_evaluation_${_dateStamp()}.xls`
): void {
  if (evaluations.length === 0) {
    alert('No evaluation records to export.');
    return;
  }

  const prog = metadata?.programme || "";
  const sem = metadata?.semester || "";
  const courseName = metadata?.courseName || "";
  const courseCode = metadata?.courseCode || "";
  const instructor = metadata?.instructor || "";
  const session = metadata?.session || "";

  const metaRows = `
  <Row><Cell ss:StyleID="bold"><Data ss:Type="String">PROGRAMME :</Data></Cell><Cell/><Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(prog)}</Data></Cell></Row>
  <Row><Cell ss:StyleID="bold"><Data ss:Type="String">SEMESTER :</Data></Cell><Cell/><Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(sem)}</Data></Cell></Row>
  <Row><Cell ss:StyleID="bold"><Data ss:Type="String">COURSE NAME :</Data></Cell><Cell/><Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(courseName)}</Data></Cell></Row>
  <Row><Cell ss:StyleID="bold"><Data ss:Type="String">COURSE CODE :</Data></Cell><Cell/><Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(courseCode)}</Data></Cell></Row>
  <Row><Cell ss:StyleID="bold"><Data ss:Type="String">INSTRUCTOR :</Data></Cell><Cell/><Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(instructor)}</Data></Cell></Row>
  <Row><Cell ss:StyleID="title"><Data ss:Type="String">PRACTICAL MARKS ${escapeXml(session)}</Data></Cell></Row>
  <Row ss:StyleID="header">
    <Cell ss:StyleID="header"><Data ss:Type="String">SL NO</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">ROLL</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">NAME</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">PROGRAMME</Data></Cell>
    <Cell ss:StyleID="header" ss:MergeAcross="22"><Data ss:Type="String">Internal</Data></Cell>
    <Cell ss:StyleID="header" ss:MergeAcross="3"><Data ss:Type="String">End Sem</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Final Marks out of 100</Data></Cell>
  </Row>
  <Row ss:StyleID="header">
    <Cell/><Cell/><Cell/><Cell/>
    ${Array.from({ length: 10 }).map((_, idx) => `<Cell ss:StyleID="header" ss:MergeAcross="1"><Data ss:Type="String">EXP-${idx + 1}</Data></Cell>`).join('')}
    <Cell/><Cell/>
    <Cell ss:StyleID="header"><Data ss:Type="String">Total Internal   ( 50)</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Lab Test and/or Mini Project-30</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Viva Voce-20</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Total Internal   ( 50)</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Marks Obtained (Full marks 50)</Data></Cell>
    <Cell/>
  </Row>
  <Row ss:StyleID="header">
    <Cell/><Cell/><Cell/><Cell/>
    ${Array.from({ length: 10 }).map(() => `<Cell ss:StyleID="header"><Data ss:Type="String">Note Book</Data></Cell><Cell ss:StyleID="header"><Data ss:Type="String">Prac Perf</Data></Cell>`).join('')}
    <Cell ss:StyleID="header"><Data ss:Type="String">Total (40)</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">Viva Voce-10</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/><Cell/><Cell/>
  </Row>
  <Row/>
  <Row ss:StyleID="header">
    ${Array.from({ length: 30 }).map(() => `<Cell/>`).join('')}
    <Cell ss:StyleID="header"><Data ss:Type="String">G=E+F</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">H=D+G</Data></Cell>
  </Row>`;

  const dataRows = evaluations.map((row, i) => {
    const style = i % 2 === 0 ? '' : ' ss:StyleID="even"';
    const exps = Array.from({ length: 10 }, (_, idx) => {
      const e = row.experiments?.find((x) => x.exp === idx + 1);
      const nb = e && typeof e.notebook === 'number' ? e.notebook : 0;
      const perf = e && typeof e.performance === 'number' ? e.performance : 0;
      return `<Cell><Data ss:Type="Number">${nb}</Data></Cell><Cell><Data ss:Type="Number">${perf}</Data></Cell>`;
    }).join('');

    const expTotal = row.experimentsTotal ?? 0;
    const intViva = row.internalViva ?? 0;
    const totInternal = row.totalInternal ?? (expTotal + intViva);
    const endLab = row.endSemLabTest ?? 0;
    const endViva = row.endSemViva ?? 0;
    const totEndSem = row.totalEndSem ?? (endLab + endViva);
    const finalMarks = row.finalMarks ?? (totInternal + totEndSem);

    return `<Row${style}>
      <Cell><Data ss:Type="Number">${row.slNo || i + 1}</Data></Cell>
      ${cell(row.roll)}
      ${cell(row.name)}
      ${cell(row.programme || 'CSE CS')}
      ${exps}
      <Cell ss:Formula="=SUM(RC[-20]:RC[-1])"><Data ss:Type="Number">${expTotal}</Data></Cell>
      <Cell><Data ss:Type="Number">${intViva}</Data></Cell>
      <Cell ss:StyleID="badge_blue" ss:Formula="=SUM(RC[-2]:RC[-1])"><Data ss:Type="Number">${totInternal}</Data></Cell>
      <Cell><Data ss:Type="Number">${endLab}</Data></Cell>
      <Cell><Data ss:Type="Number">${endViva}</Data></Cell>
      <Cell ss:StyleID="badge_blue" ss:Formula="=RC[-3]"><Data ss:Type="Number">${totInternal}</Data></Cell>
      <Cell ss:StyleID="badge_blue" ss:Formula="=SUM(RC[-3]:RC[-2])"><Data ss:Type="Number">${totEndSem}</Data></Cell>
      <Cell ss:StyleID="badge_green" ss:Formula="=RC[-2]+RC[-1]"><Data ss:Type="Number">${finalMarks}</Data></Cell>
    </Row>`;
  });

  const sheetContent = `${metaRows}\n${dataRows.join('\n')}`;
  const xml = buildWorkbook([{ name: 'PRACTICAL', content: sheetContent }]);
  downloadXls(xml, filename);
}

export function exportUniversityPracticalRegisterCsv(
  evaluations: ContinuousEvaluationRow[],
  metadata?: Partial<CourseEvaluationMetadata>,
  filename?: string
): void {
  if (evaluations.length === 0) {
    alert('No evaluation records to export.');
    return;
  }

  const now = new Date();
  const defaultSession = `${now.getMonth() + 1 <= 6 ? "EVEN SEM MAY" : "ODD SEM NOV"} ${now.getFullYear()}`;

  const prog = metadata?.programme || "";
  const sem = metadata?.semester || "";
  const courseName = metadata?.courseName || "";
  const courseCode = metadata?.courseCode || "";
  const instructor = metadata?.instructor || "";
  const session = metadata?.session || defaultSession;

  const targetFilename = filename || `${courseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Practical_Register_${_dateStamp()}.csv`;

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const makeRow = (cells: unknown[]): string => {
    const padded = [...cells];
    while (padded.length < 32) {
      padded.push('');
    }
    return padded.slice(0, 32).map(escapeCsv).join(',');
  };

  // 1. Metadata rows (1 to 6)
  const r1 = makeRow(['PROGRAMME :', '', prog]);
  const r2 = makeRow(['SEMESTER :', '', sem]);
  const r3 = makeRow(['COURSE NAME :', '', courseName]);
  const r4 = makeRow(['COURSE CODE :', '', courseCode]);
  const r5 = makeRow(['INSTRUCTOR :', '', instructor]);
  const r6 = makeRow([`PRACTICAL MARKS ${session}`]);

  // 2. Table Headers (7 to 11)
  const r7Cells: unknown[] = ['SL NO', 'ROLL', 'NAME', 'PROGRAMME', 'Internal'];
  while (r7Cells.length < 27) r7Cells.push('');
  r7Cells.push('End Sem');
  while (r7Cells.length < 31) r7Cells.push('');
  r7Cells.push('Final Marks out of 100');
  const r7 = makeRow(r7Cells);

  const r8Cells: unknown[] = ['', '', '', ''];
  for (let i = 1; i <= 10; i++) {
    r8Cells.push(`EXP-${i}`, '');
  }
  r8Cells.push('', ''); // cols 25 & 26
  r8Cells.push('Total Internal   ( 50)'); // col 27
  r8Cells.push('Lab Test and/or Mini Project-30'); // col 28
  r8Cells.push('Viva Voce-20'); // col 29
  r8Cells.push('Total Internal   ( 50)'); // col 30
  r8Cells.push('Marks Obtained (Full marks 50)'); // col 31
  r8Cells.push(''); // col 32
  const r8 = makeRow(r8Cells);

  const r9Cells: unknown[] = ['', '', '', ''];
  for (let i = 1; i <= 10; i++) {
    r9Cells.push('Note Book', 'Prac Perf');
  }
  r9Cells.push('Total (40)'); // col 25
  r9Cells.push('Viva Voce-10'); // col 26
  while (r9Cells.length < 32) r9Cells.push('');
  const r9 = makeRow(r9Cells);

  const r10 = makeRow([]);

  const r11Cells: unknown[] = [];
  while (r11Cells.length < 30) r11Cells.push('');
  r11Cells.push('G=E+F', 'H=D+G');
  const r11 = makeRow(r11Cells);

  // 3. Student rows (12+)
  const studentRows = evaluations.map((row, i) => {
    const exps: (number | string)[] = [];
    for (let idx = 1; idx <= 10; idx++) {
      const e = row.experiments?.find((x) => x.exp === idx);
      exps.push(e?.notebook ?? 0, e?.performance ?? 0);
    }

    const expTotal = row.experimentsTotal ?? exps.reduce((sum: number, v) => sum + (Number(v) || 0), 0);
    const intViva = row.internalViva ?? 0;
    const totInternal = row.totalInternal ?? (expTotal + intViva);
    const endLab = row.endSemLabTest ?? 0;
    const endViva = row.endSemViva ?? 0;
    const totEndSem = row.totalEndSem ?? (endLab + endViva);
    const finalMarks = row.finalMarks ?? (totInternal + totEndSem);

    const cells: unknown[] = [
      row.slNo || i + 1,
      row.roll,
      row.name,
      row.programme || prog || 'CSE CS',
      ...exps,
      expTotal,
      intViva,
      totInternal,
      endLab,
      endViva,
      totInternal, // col 30
      totEndSem,   // col 31
      finalMarks,  // col 32
    ];
    return makeRow(cells);
  });

  const fullCsv = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, ...studentRows].join('\r\n');
  downloadCsv(fullCsv, targetFilename);
}

// =============================================================================
// UNIVERSITY CONTINUOUS PRACTICAL EVALUATION REGISTER (.XLSX) EXPORT
// Native OpenXML Workbook matching Sheet 1 (PRACTICAL) with exact colors & merges
// =============================================================================
export async function exportUniversityPracticalRegisterXlsx(
  evaluations: ContinuousEvaluationRow[],
  metadata?: Partial<CourseEvaluationMetadata>,
  filename?: string
): Promise<void> {
  if (evaluations.length === 0) {
    alert('No evaluation records to export.');
    return;
  }

  const now = new Date();
  const isEven = now.getMonth() + 1 <= 6;
  const defaultSession = `${isEven ? "EVEN SEM MAY" : "ODD SEM NOV"} ${now.getFullYear()}`;

  const prog = metadata?.programme || "";
  const sem = metadata?.semester || "";
  const courseName = metadata?.courseName || "Continuous_Evaluation";
  const courseCode = metadata?.courseCode || "";
  const instructor = metadata?.instructor || "";
  const session = metadata?.session || defaultSession;

  const defaultFilename = `${courseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Practical_Register_${_dateStamp()}.xlsx`;
  const targetFilename = filename ? (filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`) : defaultFilename;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LMS Academic Portal';
  workbook.lastModifiedBy = instructor;
  workbook.created = now;
  workbook.modified = now;

  const worksheet = workbook.addWorksheet('PRACTICAL', {
    views: [{ showGridLines: true }],
  });

  // Color Palette from University Reference Register (Cybercrime Investigation and Forensics Lab_CSE CS.xlsx)
  const PALETTE = {
    programmeBg: 'FFFDE9D9',      // Soft Peach
    semesterBg: 'FFF2DBDB',       // Muted Lavender / Pink
    courseNameBg: 'FFFBD4B4',     // Warm Apricot
    courseCodeBg: 'FFB8CCE4',     // Soft Pastel Blue
    instructorBg: 'FFFBD4B4',     // Warm Apricot
    bannerGreenBg: 'FF92D050',    // Vibrant University Green
    studentHeaderBg: 'FFE5B8B7',  // Rose Mauve (Cols A-D, Rows 10-11)
    internalHeaderBg: 'FFC4BD97', // Tan Gold (Internal, Exp 1-10, Tot 40, Viva 10)
    totalYellowBg: 'FFFFFF00',    // Bright Accent Yellow (AA8, AD8)
    endSemHeaderBg: 'FF8DB3E2',   // Soft Ice Blue (AB7:AE7)
    labTestVivaBg: 'FFE5DFEC',    // Soft Lavender (AB8:AC9)
    marksObtainedBg: 'FFB6DDE8',  // Soft Cyan Blue (AE8:AE9)
    finalMarksBg: 'FFFBD4B4',     // Warm Apricot (AF7:AF9)
    borderColor: 'FFD9D9D9',      // Thin border
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: PALETTE.borderColor } },
    left: { style: 'thin', color: { argb: PALETTE.borderColor } },
    bottom: { style: 'thin', color: { argb: PALETTE.borderColor } },
    right: { style: 'thin', color: { argb: PALETTE.borderColor } },
  };

  const setCellFill = (cell: ExcelJS.Cell, argb: string) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb },
    };
  };

  // Row 1: PROGRAMME :
  worksheet.mergeCells('A1:B1');
  worksheet.getCell('A1').value = 'PROGRAMME :';
  worksheet.getCell('A1').font = { name: 'Calibri', size: 11, bold: true };
  worksheet.getCell('C1').value = prog;
  worksheet.getCell('C1').font = { name: 'Calibri', size: 11, bold: true };
  for (let c = 3; c <= 28; c++) {
    setCellFill(worksheet.getRow(1).getCell(c), PALETTE.programmeBg);
  }

  // Row 2: SEMESTER :
  worksheet.mergeCells('A2:B2');
  worksheet.getCell('A2').value = 'SEMESTER :';
  worksheet.getCell('A2').font = { name: 'Calibri', size: 11, bold: true };
  worksheet.getCell('C2').value = sem;
  worksheet.getCell('C2').font = { name: 'Calibri', size: 11, bold: true };
  for (let c = 3; c <= 28; c++) {
    setCellFill(worksheet.getRow(2).getCell(c), PALETTE.semesterBg);
  }

  // Row 3: COURSE NAME :
  worksheet.mergeCells('A3:B3');
  worksheet.getCell('A3').value = 'COURSE NAME :';
  worksheet.getCell('A3').font = { name: 'Calibri', size: 11, bold: true };
  worksheet.getCell('C3').value = courseName;
  worksheet.getCell('C3').font = { name: 'Calibri', size: 11, bold: true };
  for (let c = 3; c <= 28; c++) {
    setCellFill(worksheet.getRow(3).getCell(c), PALETTE.courseNameBg);
  }

  // Row 4: COURSE CODE :
  worksheet.mergeCells('A4:B4');
  worksheet.getCell('A4').value = 'COURSE CODE :';
  worksheet.getCell('A4').font = { name: 'Calibri', size: 11, bold: true };
  worksheet.getCell('C4').value = courseCode;
  worksheet.getCell('C4').font = { name: 'Calibri', size: 11, bold: true };
  for (let c = 3; c <= 28; c++) {
    setCellFill(worksheet.getRow(4).getCell(c), PALETTE.courseCodeBg);
  }

  // Row 5: INSTRUCTOR :
  worksheet.mergeCells('A5:B5');
  worksheet.getCell('A5').value = 'INSTRUCTOR :';
  worksheet.getCell('A5').font = { name: 'Calibri', size: 11, bold: true };
  worksheet.getCell('C5').value = instructor;
  worksheet.getCell('C5').font = { name: 'Calibri', size: 11, bold: true };
  for (let c = 3; c <= 28; c++) {
    setCellFill(worksheet.getRow(5).getCell(c), PALETTE.instructorBg);
  }

  // Row 6: PRACTICAL MARKS BANNER
  worksheet.mergeCells('A6:AF6');
  const bannerCell = worksheet.getCell('A6');
  bannerCell.value = `PRACTICAL MARKS ${session}`;
  bannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
  bannerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 1; c <= 32; c++) {
    setCellFill(worksheet.getRow(6).getCell(c), PALETTE.bannerGreenBg);
  }

  // Row 7: Main Headers
  const studentHeaderDefs: Array<{ col: number; label: string; mergeCoord: string }> = [
    { col: 1, label: 'SL NO', mergeCoord: 'A7:A11' },
    { col: 2, label: 'ROLL', mergeCoord: 'B7:B11' },
    { col: 3, label: 'NAME', mergeCoord: 'C7:C11' },
    { col: 4, label: 'PROGRAMME', mergeCoord: 'D7:D11' },
  ];

  studentHeaderDefs.forEach((def) => {
    worksheet.mergeCells(def.mergeCoord);
    const cell = worksheet.getRow(7).getCell(def.col);
    cell.value = def.label;
    cell.font = { name: 'Calibri', size: 11, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    for (let r = 7; r <= 11; r++) {
      const c = worksheet.getRow(r).getCell(def.col);
      setCellFill(c, PALETTE.studentHeaderBg);
      c.border = thinBorder;
    }
  });

  // Row 7: Internal (E7:AA7 = cols 5 to 27)
  worksheet.mergeCells('E7:AA7');
  const internalCell = worksheet.getCell('E7');
  internalCell.value = 'Internal';
  internalCell.font = { name: 'Calibri', size: 11, bold: true };
  internalCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 5; c <= 27; c++) {
    const cell = worksheet.getRow(7).getCell(c);
    setCellFill(cell, PALETTE.internalHeaderBg);
    cell.border = thinBorder;
  }

  // Row 7: End Sem (AB7:AE7 = cols 28 to 31)
  worksheet.mergeCells('AB7:AE7');
  const endSemCell = worksheet.getCell('AB7');
  endSemCell.value = 'End Sem';
  endSemCell.font = { name: 'Calibri', size: 11, bold: true };
  endSemCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let c = 28; c <= 31; c++) {
    const cell = worksheet.getRow(7).getCell(c);
    setCellFill(cell, PALETTE.endSemHeaderBg);
    cell.border = thinBorder;
  }

  // Row 7: Final Marks out of 100 (AF7:AF9 = col 32, rows 7 to 9)
  worksheet.mergeCells('AF7:AF9');
  const finalMarksHeaderCell = worksheet.getCell('AF7');
  finalMarksHeaderCell.value = 'Final Marks out of 100';
  finalMarksHeaderCell.font = { name: 'Calibri', size: 11, bold: true };
  finalMarksHeaderCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 7; r <= 9; r++) {
    const cell = worksheet.getRow(r).getCell(32);
    setCellFill(cell, PALETTE.finalMarksBg);
    cell.border = thinBorder;
  }

  // Row 8: EXP-1 to EXP-10 (each spans 2 columns, rows 8)
  for (let i = 1; i <= 10; i++) {
    const startCol = 5 + (i - 1) * 2;
    const endCol = startCol + 1;
    worksheet.mergeCells(8, startCol, 8, endCol);
    const expCell = worksheet.getRow(8).getCell(startCol);
    expCell.value = `EXP-${i}`;
    expCell.font = { name: 'Calibri', size: 11, bold: true };
    expCell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellFill(worksheet.getRow(8).getCell(startCol), PALETTE.internalHeaderBg);
    setCellFill(worksheet.getRow(8).getCell(endCol), PALETTE.internalHeaderBg);
    worksheet.getRow(8).getCell(startCol).border = thinBorder;
    worksheet.getRow(8).getCell(endCol).border = thinBorder;
  }

  // Row 8: Total Internal ( 50) on col 27 (AA8:AA9)
  worksheet.mergeCells('AA8:AA9');
  const aa8Cell = worksheet.getCell('AA8');
  aa8Cell.value = 'Total Internal   ( 50)';
  aa8Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  aa8Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 8; r <= 9; r++) {
    const c = worksheet.getRow(r).getCell(27);
    setCellFill(c, PALETTE.totalYellowBg);
    c.border = thinBorder;
  }

  // Row 8: Lab Test (AB8:AB9)
  worksheet.mergeCells('AB8:AB9');
  const ab8Cell = worksheet.getCell('AB8');
  ab8Cell.value = 'Lab Test and/or Mini Project-30';
  ab8Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  ab8Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 8; r <= 9; r++) {
    const c = worksheet.getRow(r).getCell(28);
    setCellFill(c, PALETTE.labTestVivaBg);
    c.border = thinBorder;
  }

  // Row 8: Viva Voce-20 (AC8:AC9)
  worksheet.mergeCells('AC8:AC9');
  const ac8Cell = worksheet.getCell('AC8');
  ac8Cell.value = 'Viva Voce-20';
  ac8Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  ac8Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 8; r <= 9; r++) {
    const c = worksheet.getRow(r).getCell(29);
    setCellFill(c, PALETTE.labTestVivaBg);
    c.border = thinBorder;
  }

  // Row 8: Total Internal ( 50) on col 30 (AD8:AD9)
  worksheet.mergeCells('AD8:AD9');
  const ad8Cell = worksheet.getCell('AD8');
  ad8Cell.value = 'Total Internal   ( 50)';
  ad8Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  ad8Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 8; r <= 9; r++) {
    const c = worksheet.getRow(r).getCell(30);
    setCellFill(c, PALETTE.totalYellowBg);
    c.border = thinBorder;
  }

  // Row 8: Marks Obtained (Full marks 50) on col 31 (AE8:AE9)
  worksheet.mergeCells('AE8:AE9');
  const ae8Cell = worksheet.getCell('AE8');
  ae8Cell.value = 'Marks Obtained (Full marks 50)';
  ae8Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  ae8Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let r = 8; r <= 9; r++) {
    const c = worksheet.getRow(r).getCell(31);
    setCellFill(c, PALETTE.marksObtainedBg);
    c.border = thinBorder;
  }

  // Row 9: Note Book / Prac Perf (Cols 5 to 24)
  for (let i = 1; i <= 10; i++) {
    const nbCol = 5 + (i - 1) * 2;
    const ppCol = nbCol + 1;
    const nbCell = worksheet.getRow(9).getCell(nbCol);
    nbCell.value = 'Note Book';
    nbCell.font = { name: 'Calibri', size: 10, bold: true };
    nbCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    nbCell.border = thinBorder;

    const ppCell = worksheet.getRow(9).getCell(ppCol);
    ppCell.value = 'Prac Perf';
    ppCell.font = { name: 'Calibri', size: 10, bold: true };
    ppCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    ppCell.border = thinBorder;
  }

  // Row 9: Total (40) col 25 & Viva Voce-10 col 26
  const y9Cell = worksheet.getRow(9).getCell(25);
  y9Cell.value = 'Total (40)';
  y9Cell.font = { name: 'Calibri', size: 10, bold: true };
  y9Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  setCellFill(y9Cell, PALETTE.internalHeaderBg);
  y9Cell.border = thinBorder;

  const z9Cell = worksheet.getRow(9).getCell(26);
  z9Cell.value = 'Viva Voce-10';
  z9Cell.font = { name: 'Calibri', size: 10, bold: true };
  z9Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  setCellFill(z9Cell, PALETTE.internalHeaderBg);
  z9Cell.border = thinBorder;

  // Rows 10 & 11: Formula & Subheader Backgrounds (Cols 5 to 32)
  for (let r = 10; r <= 11; r++) {
    for (let c = 5; c <= 32; c++) {
      const cell = worksheet.getRow(r).getCell(c);
      setCellFill(cell, PALETTE.studentHeaderBg);
      cell.border = thinBorder;
    }
  }
  const ae11Cell = worksheet.getRow(11).getCell(31);
  ae11Cell.value = 'G=E+F';
  ae11Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  ae11Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  const af11Cell = worksheet.getRow(11).getCell(32);
  af11Cell.value = 'H=D+G';
  af11Cell.font = { name: 'Times New Roman', size: 11, bold: true };
  af11Cell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Data Rows: Row 12 onwards
  evaluations.forEach((row, i) => {
    const rowNum = 12 + i;
    const r = worksheet.getRow(rowNum);

    const exps: number[] = [];
    for (let idx = 1; idx <= 10; idx++) {
      const e = row.experiments?.find((x) => x.exp === idx);
      exps.push(e?.notebook ?? 0, e?.performance ?? 0);
    }

    const expTotal = row.experimentsTotal ?? exps.reduce((sum: number, v) => sum + (Number(v) || 0), 0);
    const intViva = row.internalViva ?? 0;
    const totInternal = row.totalInternal ?? (expTotal + intViva);
    const endLab = row.endSemLabTest ?? 0;
    const endViva = row.endSemViva ?? 0;
    const totEndSem = row.totalEndSem ?? (endLab + endViva);
    const finalMarks = row.finalMarks ?? (totInternal + totEndSem);

    const cellsData: Array<{ val: unknown; align?: 'left' | 'center' | 'right'; bold?: boolean }> = [
      { val: row.slNo || i + 1, align: 'center' },
      { val: row.roll, align: 'left' },
      { val: row.name, align: 'left' },
      { val: row.programme || prog || 'CSE CS', align: 'left' },
      ...exps.map((val) => ({ val, align: 'center' as const })),
      { val: expTotal, align: 'center', bold: true },
      { val: intViva, align: 'center' },
      { val: totInternal, align: 'center', bold: true },
      { val: endLab, align: 'center' },
      { val: endViva, align: 'center' },
      { val: totInternal, align: 'center', bold: true },
      { val: totEndSem, align: 'center', bold: true },
      { val: finalMarks, align: 'center', bold: true },
    ];

    cellsData.forEach((item, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      cell.value = item.val as ExcelJS.CellValue;
      cell.font = { name: 'Calibri', size: 11, bold: item.bold || false };
      cell.alignment = { vertical: 'middle', horizontal: item.align || 'center' };
      cell.border = thinBorder;
    });
  });

  // Set exact column widths matching university layout
  worksheet.columns = [
    { width: 8 },   // A: SL NO
    { width: 22 },  // B: ROLL
    { width: 28 },  // C: NAME
    { width: 16 },  // D: PROGRAMME
    ...Array(20).fill({ width: 9 }),  // E to X: EXP 1 to 10
    { width: 12 },  // Y: Total (40)
    { width: 14 },  // Z: Viva Voce-10
    { width: 18 },  // AA: Total Internal ( 50)
    { width: 26 },  // AB: Lab Test
    { width: 14 },  // AC: Viva Voce-20
    { width: 18 },  // AD: Total Internal ( 50)
    { width: 26 },  // AE: Marks Obtained (Full marks 50)
    { width: 22 },  // AF: Final Marks out of 100
  ];

  // Generate binary XLSX buffer and trigger native browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = targetFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _dateStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
