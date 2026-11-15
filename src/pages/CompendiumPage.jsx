import { useCompendium } from '../lib/compendium'
import CompendiumBrowser from '../components/compendium/CompendiumBrowser'
import HouseRulesManager from '../components/compendium/HouseRulesManager'

export default function CompendiumPage() {
  const { houseRules } = useCompendium()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="title text-3xl">📖 Kompendium</h1>
        <p className="text-stone-400">Regeln, Zauber, Gegenstände, Monster und eure Hausregeln – alles zum Nachschlagen.</p>
      </div>
      <HouseRulesManager />
      <section className="card">
        <CompendiumBrowser houseRules={houseRules} />
      </section>
    </div>
  )
}
