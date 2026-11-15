import { useCompendium } from '../lib/compendium'
import CompendiumBrowser from '../components/compendium/CompendiumBrowser'
import HouseRulesManager from '../components/compendium/HouseRulesManager'
import PageHeader from '../components/PageHeader'

export default function CompendiumPage() {
  const { houseRules } = useCompendium()
  return (
    <div className="space-y-6">
      <PageHeader icon="📖" eyebrow="Nachschlagen" title="Kompendium" subtitle="Regeln, Zauber, Gegenstände, Monster und eure Hausregeln – alles zum Nachschlagen." />
      <HouseRulesManager />
      <section className="card">
        <CompendiumBrowser houseRules={houseRules} />
      </section>
    </div>
  )
}
