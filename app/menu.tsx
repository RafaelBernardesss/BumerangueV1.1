import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

//importando componentes  
import HearderHome from "../components/HearderHome";



export default function Home() {

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false}>


        {/* HEADER */}
        <View style={styles.header}>

          <HearderHome></HearderHome>

        </View>



        {/* HERO */}
        <View style={styles.hero}>


          <Text style={styles.heroTitle}>
            Troque serviços
            de forma gratuita
          </Text>


          <Text style={styles.heroText}>
            Ajude pessoas com suas habilidades
            e receba ajuda quando precisar.
          </Text>



          <View style={styles.stats}>


            <View style={styles.statBox}>

              <Text style={styles.statNumber}>
                8 mil
              </Text>

              <Text style={styles.statLabel}>
                Usuários
              </Text>

            </View>



            <View style={styles.statBox}>

              <Text style={styles.statNumber}>
                39 mil
              </Text>

              <Text style={styles.statLabel}>
                Trocas
              </Text>

            </View>


          </View>



          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push("/escolha")}
          >

            <Text style={styles.heroButtonText}>
              Começar agora
            </Text>

          </TouchableOpacity>


        </View>





        {/* CATEGORIAS */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Categorias
          </Text>

          <Text style={styles.link}>
            Ver todas
          </Text>

        </View>




        <View style={styles.grid}>


          <CategoryCard
            icon="color-palette-outline"
            title="Design"
          />


          <CategoryCard
            icon="code-slash-outline"
            title="Programação"
          />


          <CategoryCard
            icon="school-outline"
            title="Aulas"
          />


          <CategoryCard
            icon="construct-outline"
            title="Consertos"
          />


        </View>





        {/* COMO FUNCIONA */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Como funciona
          </Text>

        </View>




        <Step
          number="1"
          title="Ofereça"
          description="Publique suas habilidades."
        />


        <Step
          number="2"
          title="Encontre"
          description="Ache pessoas que precisam."
        />


        <Step
          number="3"
          title="Troque"
          description="Receba ajuda depois."
        />



        <View style={{ height: 120 }} />

      </ScrollView>




      {/* BOTÃO FLUTUANTE */}

      <TouchableOpacity style={styles.fab}>

        <Ionicons
          name="add"
          size={38}
          color="#000"
        />

      </TouchableOpacity>



    </SafeAreaView>
  );
}





function CategoryCard({
  icon,
  title
}: any) {

  return (

    <TouchableOpacity style={styles.card}>


      <Ionicons
        name={icon}
        size={34}
        color="#00AFFF"
      />


      <Text style={styles.cardText}>
        {title}
      </Text>


    </TouchableOpacity>

  )

}





function Step({
  number,
  title,
  description
}: any) {


  return (

    <View style={styles.step}>


      <View style={styles.circle}>

        <Text style={styles.circleText}>
          {number}
        </Text>

      </View>



      <View>

        <Text style={styles.stepTitle}>
          {title}
        </Text>


        <Text style={styles.stepDescription}>
          {description}
        </Text>


      </View>



    </View>

  )

}






const styles = StyleSheet.create({


  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },



  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },



  logo: {
    color: "#00AFFF",
    fontSize: 34,
    fontWeight: "bold",
  },




  hero: {

    margin: 20,
    backgroundColor: "#0D1324",
    borderRadius: 25,
    padding: 25,
  },



  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },



  heroText: {
    color: "#999",
    fontSize: 17,
    marginTop: 12,
    lineHeight: 25,
  },



  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
  },



  statBox: {
    alignItems: "center",
  },



  statNumber: {
    color: "#00AFFF",
    fontSize: 28,
    fontWeight: "bold",
  },



  statLabel: {
    color: "#888",
    marginTop: 5,
  },



  heroButton: {
    backgroundColor: "#00AFFF",
    padding: 16,
    borderRadius: 15,
    marginTop: 25,
    alignItems: "center",
  },



  heroButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "bold",
  },




  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 25,
  },



  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },



  link: {
    color: "#00AFFF",
    fontSize: 17,
  },




  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 15,
  },



  card: {
    width: "42%",
    backgroundColor: "#0D1324",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
  },



  cardText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 17,
    fontWeight: "600",
  },




  step: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1324",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 18,
    borderRadius: 20,
  },



  circle: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },



  circleText: {
    fontWeight: "bold",
    fontSize: 18,
  },



  stepTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "bold",
  },



  stepDescription: {
    color: "#888",
    marginTop: 5,
  },




  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: "#00AFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },


});