package com.ssafy.backend.domain.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.language.v1.*;
import com.jcraft.jsch.*;
import com.ssafy.backend.domain.chat.dto.ChatInfo;
import com.ssafy.backend.domain.chat.dto.ChatWordDto;
import com.ssafy.backend.domain.chat.entity.Chat;
import com.ssafy.backend.domain.chat.entity.ChatRoom;
import com.ssafy.backend.domain.chat.repository.ChatRepository;
import com.ssafy.backend.domain.chat.repository.ChatRoomRepository;
import com.ssafy.backend.domain.user.User;
import com.ssafy.backend.domain.user.repository.UserRepository;
import com.ssafy.backend.domain.user.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.google.cloud.language.v1.Document.Type;
import static com.google.cloud.language.v1.Document.newBuilder;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatScheduler {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final RedisTemplate<String, ChatInfo> chatRedisTemplate;
    private final ChallengeService challengeService;

    final static String user = "ubuntu";
    final static String host = "52.79.247.214";
    final static String privateKey = "/key/J9E205T.pem";

    final static Map<String, String> CategoryMap = new HashMap<String, String>() {{
        put("Adult", "성인");
        put("Arts & Entertainment", "예술 및 엔터테인먼트");
        put("Autos & Vehicles", "자동차 및 차량");
        put("Beauty & Fitness", "미용 및 피트니스");
        put("Books & Literature", "책 및 문학");
        put("Business & Industrial", "비즈니스 및 산업");
        put("Computers & Electronics", "컴퓨터 및 전자제품");
        put("Finance", "금융");
        put("Food & Drink", "음식 및 음료");
        put("Games", "게임");
        put("Health", "건강");
        put("Hobbies & Leisure", "취미 및 여가");
        put("Home & Garden", "집 및 정원");
        put("Internet & Telecom", "인터넷 및 통신");
        put("Jobs & Education", "직업 및 교육");
        put("Law & Government", "법률 및 정부");
        put("News", "뉴스");
        put("Online Communities", "온라인 커뮤니티");
        put("People & Society", "사람들과 사회");
        put("Pets & Animals", "애완 동물 및 동물들");
        put("Real Estate", "부동산");
        put("Reference", "참고자료");
        put("Science", "과학");
        put("Sensitive Subjects", "민감한 주제들");
        put("Shopping", "쇼핑");
        put("Sports", "스포츠");
        put("Travel & Transportation", "여행 및 교통");
    }};

    @Scheduled(cron = "0 1/5 * * * ?")
    public void chatTransfer() throws IOException {

        System.out.println("채팅 저장 실행");
        JSch jsch = new JSch();
        List<ChatRoom> chatRoomList = chatRoomRepository.findAll();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        // 도전과제 채팅 카운터 위한 맵 -> compute 사용해서 채팅 친 사람만 카운트
        Map<Long, Integer> userChatCount = new HashMap<>();
        Map<Long, String> chatMap = new HashMap<>();
        List<ChatWordDto> result = new ArrayList<>();
        for (ChatRoom chatRoom : chatRoomList) {
            String chatKey = "chat";
            List<ChatInfo> chatInfos = chatRedisTemplate.opsForList().range(chatKey + chatRoom.getId(), 0, -1);
            // 레디스 비우기
            chatRedisTemplate.delete(chatKey + chatRoom.getId());
            if (chatInfos == null)
                continue;

            // 유저별 채팅 구분 필요
            for (ChatInfo chatInfo : chatInfos) {
                if (chatMap.containsKey(chatInfo.getUserId())) {
                    chatMap.put(chatInfo.getUserId(), chatMap.get(chatInfo.getUserId()) + chatInfo.getContent());
                } else {
                    chatMap.put(chatInfo.getUserId(), chatInfo.getContent());
                }

                ChatWordDto dto = ChatWordDto.builder()
                        .userId(chatInfo.getUserId())
                        .chatroomId(chatRoom.getId())
                        .categoryList(new ArrayList<>()).build();

                if (chatMap.get(chatInfo.getUserId()).length() >= 50) {
                    List<ClassificationCategory> classificationCategories = googleNaturalAPI(chatMap,
                            chatInfo);

                    if (classificationCategories.size() == 0) continue;

                    for (ClassificationCategory classificationCategory : classificationCategories) {
                        StringTokenizer st = new StringTokenizer(classificationCategory.getName(), "/");
                        dto.getCategoryList().add(CategoryMap.get(st.nextToken()));
//	 				 		writer.write(outputLine);
                    }
                    chatMap.put(chatInfo.getUserId(), "");
                    result.add(dto);
                }

            }
            List<Chat> chats = chatInfos.stream()
                    .map(chatInfo -> {
                        userChatCount.compute(chatInfo.getUserId(), (userId, count) -> count == null ? 1 : count + 1);
                        return chatInfo.toEntity(userMap.get(chatInfo.getUserId()), chatRoom);
                    })
                    .collect(Collectors.toList());
            chatRepository.saveAll(chats);
        }

        // 도전과제 채팅 카운트
        userChatCount.keySet().forEach(key -> challengeService.addChat(key, userChatCount.get(key)));

        // 결과 리스트를 JSON 파일으로 ec서버에 생성
        try {
            File file = new File("ChatScheduler.java");
            String absolutePath = file.getAbsolutePath();
            System.out.println(absolutePath);
            jsch.addIdentity(privateKey);
            // EC2 서버와 연결하기 위한 세션 생성
            Session session = jsch.getSession(user, host, 22);

            // 호스트 키 검사를 하지 않도록 설정
            session.setConfig("StrictHostKeyChecking", "no");
            // 세션 연결
            session.connect();
            // SFTP 채널을 열고 연결
            ChannelSftp channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect();

            // 폴더 생성
            // 현재 날짜와 시간 가져오기
            LocalDateTime now = LocalDateTime.now();
// 날짜와 시간을 문자열로 변환
            String date = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH"));
            String time = now.format(DateTimeFormatter.ofPattern("HH-mm"));
            // EC2 서버에 날짜 폴더 생성
            String dir = "/home/ubuntu/input/" + date;

            try {
                channel.lstat(dir);
            } catch (SftpException e) {
                if (ChannelSftp.SSH_FX_NO_SUCH_FILE == e.id) {
                    channel.mkdir(dir);
                }
            }

            // 임시 파일을 쓰기 모드로 열기
            File tempFile = File.createTempFile("temp", ".json");
            FileOutputStream fos = new FileOutputStream(tempFile);
            // ObjectMapper 객체 생성
            ObjectMapper mapper = new ObjectMapper();
            // 객체를 JSON 형식으로 변환하여 임시 파일에 쓰기
            mapper.writeValue(fos, result);
            // 스트림 닫기
            fos.close();
            // 임시 파일을 읽기 모드로 열기
            FileInputStream fis = new FileInputStream(tempFile);
            // EC2 서버에 파일을 쓰기 모드로 열기. 기존 파일이 있으면 덮어쓰기
            channel.put(fis, "/home/ubuntu/input/" + date + "/" + time + ".json", ChannelSftp.OVERWRITE);
            // 스트림과 채널 닫기
            fis.close();
            channel.disconnect();
            // 세션 닫기
            session.disconnect();
        } catch (IOException | SftpException e) {
            // 예외 처리
            e.printStackTrace();
        } catch (JSchException e) {
            throw new RuntimeException(e);
        }
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void sparkStart() {
        // spark 실행
        String msg = null;
        JSch jsch = new JSch();
        try {
            jsch.addIdentity(privateKey);
            Session session = jsch.getSession(user, host, 22);
            session.setConfig("StrictHostKeyChecking", "no");
            System.out.println("Establishing Connection...");
            session.connect();
            System.out.println("Connection established.");

            // PySpark 스크립트 실행
            String pySparkCommand = "spark-submit /usr/local/spark/python/pyspark/distributed.py";
            ChannelExec channelExec = (ChannelExec) session.openChannel("exec");
            BufferedReader in = new BufferedReader(new InputStreamReader(channelExec.getInputStream()));
            channelExec.setCommand(pySparkCommand);
            channelExec.connect();

            // 스크립트의 출력을 확인 (선택 사항)
            while ((msg = in.readLine()) != null) {
                System.out.println(msg);
            }

            // 세션 종료
            channelExec.disconnect();
            session.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static List<ClassificationCategory> googleNaturalAPI(Map<Long, String> chatMap, ChatInfo chatInfo) throws IOException {
        // Instantiate the Language client com.google.cloud.language.v1.LanguageServiceClient
        try (LanguageServiceClient language = LanguageServiceClient.create()) {
            System.out.println(chatMap.get(chatInfo.getUserId()));
            // Set content to the text string
            Document doc = newBuilder().setContent(chatMap.get(chatInfo.getUserId())).setType(Type.PLAIN_TEXT).build();
            ClassificationModelOptions.V2Model v2Model = ClassificationModelOptions.V2Model.newBuilder()
                    .setContentCategoriesVersion(ClassificationModelOptions.V2Model.ContentCategoriesVersion.V2)
                    .build();
            ClassificationModelOptions options =
                    ClassificationModelOptions.newBuilder().setV2Model(v2Model).build();
            ClassifyTextRequest request =
                    ClassifyTextRequest.newBuilder()
                            .setDocument(doc)
                            .setClassificationModelOptions(options)
                            .build();
            // Detect categories in the given text
            ClassifyTextResponse response = language.classifyText(request);

            System.out.println(response.getCategoriesList().size());

            for (ClassificationCategory category : response.getCategoriesList()) {
                System.out.printf(
                        "Category name : %s, Confidence : %.3f\n",
                        category.getName(), category.getConfidence());
            }
            return response.getCategoriesList();
        }
    }
}
